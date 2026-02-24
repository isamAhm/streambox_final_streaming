import toast from 'react-hot-toast';

export const handleApiError = (error: any, customMessage?: string) => {
    console.error('API Error:', error);

    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;

        switch (status) {
            case 400:
                toast.error(message || 'Invalid request. Please check your input.');
                break;
            case 401:
                toast.error('Please sign in to continue.');
                break;
            case 403:
                toast.error('You don\'t have permission to do that.');
                break;
            case 404:
                toast.error(customMessage || 'Content not found.');
                break;
            case 429:
                toast.error('Too many requests. Please try again later.');
                break;
            case 500:
                toast.error('Server error. Please try again later.');
                break;
            default:
                toast.error(message || customMessage || 'Something went wrong. Please try again.');
        }
    } else if (error.request) {
        // Request made but no response
        toast.error('Network error. Please check your connection.');
    } else {
        // Something else happened
        toast.error(customMessage || 'An unexpected error occurred.');
    }
};

export const handleSuccess = (message: string) => {
    toast.success(message);
};
