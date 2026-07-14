import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { authService } from "./auth.service";

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      res.json({ data: { message: "Logged out successfully" } });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body);
      res.json({ data: { message: "If an account with that email exists, we've sent instructions to reset your password." } });
    } catch (err) {
      next(err);
    }
  },

  async renderResetPasswordPage(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send("Invalid or missing token.");
    }
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - Smart Expense</title>
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .container { background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
              h2 { color: #111827; margin-bottom: 24px; }
              input { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #d1d5db; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
              button { width: 100%; padding: 12px; background-color: #4F46E5; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background-color 0.2s; }
              button:hover { background-color: #4338ca; }
              .message { margin-top: 16px; color: #059669; font-weight: 500; display: none; }
              .error { margin-top: 16px; color: #dc2626; font-weight: 500; display: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <h2>Reset Your Password</h2>
              <form id="resetForm">
                  <input type="password" id="password" placeholder="Enter new password" required minlength="8">
                  <button type="submit">Update Password</button>
              </form>
              <div id="message" class="message">Password successfully updated! You can now log into the app.</div>
              <div id="error" class="error">An error occurred. The link might be expired.</div>
          </div>
          <script>
              document.getElementById('resetForm').addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const password = document.getElementById('password').value;
                  const token = new URLSearchParams(window.location.search).get('token');
                  
                  try {
                      const res = await fetch('/api/v1/auth/reset-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token, newPassword: password })
                      });
                      
                      if (res.ok) {
                          document.getElementById('resetForm').style.display = 'none';
                          document.getElementById('message').style.display = 'block';
                          document.getElementById('error').style.display = 'none';
                      } else {
                          document.getElementById('error').style.display = 'block';
                      }
                  } catch (err) {
                      document.getElementById('error').style.display = 'block';
                  }
              });
          </script>
      </body>
      </html>
    `;
    res.send(html);
  },

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
         return res.status(400).json({ error: { message: "Token and new password are required." } });
      }
      await authService.resetPassword(token, newPassword);
      res.json({ data: { message: "Password updated successfully." } });
    } catch (err) {
      next(err);
    }
  }
};
