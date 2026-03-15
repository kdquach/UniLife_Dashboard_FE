import { api } from "@/services/axios.config";

// Get feedback list for current canteen (manager dashboard)
export async function getFeedbackList(params = {}) {
    const response = await api.get("/feedbacks", { params });
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    const pagination = response.data?.pagination || null;
    return { data, pagination };
}

// Get single feedback detail
export async function getFeedbackById(feedbackId) {
    if (!feedbackId) return null;
    const response = await api.get(`/feedbacks/${feedbackId}`);
    return response.data?.data?.feedback || response.data?.data || null;
}

// Get replies of a feedback
export async function getFeedbackReplies(feedbackId, params = {}) {
    if (!feedbackId) return { data: [], pagination: null };
    const response = await api.get(`/feedback-replies/${feedbackId}/replies`, {
        params,
    });
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    const pagination = response.data?.pagination || null;
    return { data, pagination };
}

// Create a reply for a feedback (manager/owner)
export async function createFeedbackReply(feedbackId, replyText) {
    if (!feedbackId) return null;
    const response = await api.post(`/feedback-replies/${feedbackId}/replies`, {
        reply: replyText,
    });
    return response.data?.data?.reply || response.data?.data || null;
}

// Update an existing reply (only owner/admin on backend)
export async function updateFeedbackReply(replyId, replyText) {
    if (!replyId) return null;
    const response = await api.patch(`/feedback-replies/${replyId}`, {
        reply: replyText,
    });
    return response.data?.data?.reply || response.data?.data || null;
}

// Delete a reply
export async function deleteFeedbackReply(replyId) {
    if (!replyId) return null;
    const response = await api.delete(`/feedback-replies/${replyId}`);
    return response.data;
}
