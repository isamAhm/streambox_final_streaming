import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data).catch(err => {
    // Silently handle 401 errors (not authenticated yet)
    if (err.response?.status === 401) {
        return null;
    }
    throw err;
});

export default fetcher;
