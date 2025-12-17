from apscheduler.schedulers.asyncio import AsyncIOScheduler
from modules.job_scraper import JobScraper
from agents.job_search_agent import JobSearchAgent
from modules.gmail_sender import send_gmail

job_scraper = JobScraper()
ranker = JobSearchAgent()

USER_EMAIL = "arpitbanait03@gmail.com"
SEARCH_ROLE = "Data Analyst"
LOCATION = "Remote"
RESUME_SKILLS = ["python","sql","excel","powerbi","ml","dashboard"]

async def auto_job_scan():
     print("🔍 Running Job Scan...")

     jobs = await job_scraper.search(query=SEARCH_ROLE, location=LOCATION)
     print(f"📌 Fetched {len(jobs)} jobs")

     ranked = await ranker.filter_and_rank([j.dict() for j in jobs], RESUME_SKILLS)
     print("🏷 Sample ranked job:", ranked[:1])

     top_matches = [j for j in ranked if j["match_score"] >= 70]
     print(f"🔥 Jobs with score >=70: {len(top_matches)}")
     if top_matches:
        email_body = "\n\n".join(
            f"{j['title']} — {j['company']}\n{j['url']}"
            for j in top_matches
        )
        send_gmail(USER_EMAIL, f"🚀 New Job Alerts — {SEARCH_ROLE}", email_body)
        print("📬 Email Sent")

def start_scheduler():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(auto_job_scan, "interval", seconds=20)
    scheduler.start()
    print("🕒 Background Job Scheduler Started")
    return scheduler
