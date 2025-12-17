// FORCE Axios to NOT convert FormData to JSON
import axios from "axios";

axios.defaults.transformRequest = [
  function (data, headers) {
    if (data instanceof FormData) {
      delete headers["Content-Type"]; // Let browser set boundary
      return data;
    }
    return JSON.stringify(data);
  }
];
