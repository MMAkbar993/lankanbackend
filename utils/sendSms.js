const axios = require("axios");

const sendSms = async ({ phone, message }) => {
    try {
        const cleanPhone = String(phone).replace(/\+/g, "").trim();

        const response = await axios.post(
            "https://dashboard.smsapi.lk/api/v3/sms/send",
            {
                recipient: cleanPhone,
                sender_id: process.env.SMSAPI_FROM,
                type: "plain",
                message,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SMSAPI_TOKEN}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }
        );

        if (response.data?.status !== "success") {
            const customError = new Error(
                response.data?.message || "SMS sending failed"
            );

            customError.providerResponse = response.data;

            throw customError;
        }

        return response.data;
    } catch (error) {
        console.error(
            "SMSAPI.LK Error:",
            error.response?.data || error.message
        );

        const customError = new Error(
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "SMS sending failed"
        );

        customError.statusCode = error.response?.status || 500;

        customError.providerResponse =
            error.response?.data || {
                message: error.message,
            };

        throw customError;
    }
};

module.exports = sendSms;