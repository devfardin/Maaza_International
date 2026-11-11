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

const refreshTokenValidationSchema = z.object({
    cookies:
        z.object({
            refreshToken: z.string({
                message: 'Refresh token is required',
            }),
        })
})

const chagnePasswordValidationSchema = z.object({
    body: z.object({
        oldPassword: z.string({
            message: 'Old password is required',
        }),
        newPassword: z.string({
            message: 'New Password is required',
        }).min(8, 'Password must be at least 8 characters').max(72),
    })
})

const forgetPasswordValidationSchema = z.object({
    body: z.object({
        phone: z.string({
            message: 'Phone is required',
        }),
    })
})

const resetPasswordValidationSchema = z.object({
    body: z.object({
        phone: z.string({
            message: 'Phone is required',
        }),
        newPassword: z.string({
            message: 'Password is required',
        }).min(8, 'Password must be at least 8 characters').max(72),
    })
})

export const AuthValidation = {
    loginValidationSchema,
    chagnePasswordValidationSchema,
    refreshTokenValidationSchema,
    forgetPasswordValidationSchema,
    resetPasswordValidationSchema
}
