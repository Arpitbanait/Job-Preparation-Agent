from typing import List, Optional
from app.api.schemas import JobPosting
from app.config import get_settings
import httpx, asyncio, logging, random
from bs4 import BeautifulSoup
from serpapi import GoogleSearch

logger = logging.getLogger(__name__)
settings = get_settings()

def J(title, company, location, salary, desc, req, src, url):
    return JobPosting(
        title=title or "",
        company=company or "",
        location=location or "",
        salary_range=salary,
        description=desc or "",
        requirements=req or [],
        benefits=None,
        source=src,
        url=url
    )

class JobScraper:

    async def search(self, query, location=None, salary_min=None, salary_max=None, job_type=None):
        tasks = [
            self.naukri(query, location),
            self.indeed(query, location),
            self.serp_google(query, location),
            # self.linkedin(query, location)   # Enable when token added
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)
        jobs = []

        for r in results:
            if isinstance(r, Exception): continue
            jobs.extend(r)

        # remove duplicates
        final = {}
        for j in jobs:
            key = j.title.lower() + j.company.lower()
            if key not in final: final[key] = j

        return list(final.values())[:settings.MAX_JOBS_PER_SCRAPE]

    # ---------------- Naukri.com ---------------- #

    async def naukri(self, query, location=None):
        url = f"https://www.naukri.com/{query.replace(' ','-')}-jobs"
        jobs=[]

        async with httpx.AsyncClient(headers={"User-Agent":"Mozilla/5.0"}) as c:
            r=await c.get(url)
            soup=BeautifulSoup(r.text,"html.parser")

            cards=soup.select("article.jobTuple.bgWhite br ~ a.title")  # 🔥 Latest selector

            for a in cards[:20]:
                title=a.get_text(strip=True)
                parent=a.find_parent("article")
                company=parent.select_one("a.subTitle").text.strip()
                loc=parent.select_one(".locWdth").text.strip()
                salary=parent.select_one(".salary").text.strip() if parent.select_one(".salary") else None
                desc=parent.select_one(".job-description").text.strip()
                href=a["href"]

                jobs.append(J(title,company,loc,salary,desc,[],"Naukri",href))

        return jobs

    # ---------------- Indeed.com ---------------- #

    async def indeed(self,query,location=None):
        url=f"https://www.indeed.com/jobs?q={query}&l={location or ''}"
        jobs=[]

        headers={
            "User-Agent": random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                "Mozilla/5.0 (X11; Linux x86_64)"
            ]),
            "Referer":"https://www.google.com/",
            "Cookie":"ctk=allow"
        }

        async with httpx.AsyncClient(headers=headers,follow_redirects=True) as c:
            r=await c.get(url)
            if r.status_code==403:
                logger.warning("⚠ Blocked — you may need proxy rotation")
                return jobs

            soup=BeautifulSoup(r.text,"html.parser")
            cards=soup.select("a.tapItem")  # updated selector

            for c in cards[:20]:
                title=c.select_one("span[title]").text.strip()
                comp=c.select_one(".companyName").text.strip()
                loc=c.select_one(".companyLocation").text.strip()
                desc=c.select_one(".job-snippet").text.strip()
                link="https://indeed.com"+c["href"]

                jobs.append(J(title,comp,loc,None,desc,[],"Indeed",link))

        return jobs

  

    async def serp_google(self, query, location):
            jobs = []
            if not settings.SERPAPI_API_KEY:
                return jobs
            
            params = {
                "engine": "google_jobs",
                "q": query,
                "location": location or "Remote",
                "api_key": settings.SERPAPI_API_KEY
            }

            try:
                # Run GoogleSearch in executor to avoid blocking
                loop = asyncio.get_event_loop()
                data = await loop.run_in_executor(
                    None,
                    lambda: GoogleSearch(params).get_dict()
                )

                for r in data.get("jobs_results", []):
                    apply_links = []

                    # Google gives multiple sources – we extract full direct apply URLs
                    if r.get("apply_options"):
                        for app in r["apply_options"]:
                            link = app.get("link") or app.get("apply_link")
                            if link:
                                apply_links.append(link)

                    direct_url = (
                        apply_links[0] if apply_links else
                        r.get("job_highlights", [{}])[0].get("link") or
                        r.get("job_post_url") or None
                    )

                    jobs.append(J(
                        title=r.get("title"),
                        company=r.get("company_name"),
                        location=r.get("location"),
                        salary=r.get("salary"),
                        desc=r.get("description"),
                        req=[],
                        src="Google Jobs",
                        url=direct_url
                    ))
            except Exception as e:
                logger.warning(f"SerpApi error: {e}")

            return jobs

