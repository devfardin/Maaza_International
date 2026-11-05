import z from "zod";

const loginValidationSchema = z.object({
    body: z.object({
        phone: z.string({
            message: 'Phone is required',
        }),
        password: z.string({
            message: 'Password is required',
        }),
    })
})
export const AuthValidation = {
    loginValidationSchema
}
