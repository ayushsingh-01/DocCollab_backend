const { z } = require('zod');

const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const createDocumentSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    content: z.string().optional(),
});

const sendOtpSchema = z.object({
    email: z.string().email(),
});

const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
});

module.exports = {
    registerSchema,
    loginSchema,
    createDocumentSchema,
    sendOtpSchema,
    verifyOtpSchema,
};
