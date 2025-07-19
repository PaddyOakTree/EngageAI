# EngageAI Email Template Setup Guide

## Overview
This guide will help you set up email confirmation for new signups in your EngageAI project with beautiful, branded email templates.

## Step 1: Enable Email Confirmation

### Via Supabase Dashboard:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your EngageAI project
3. Go to **Authentication** → **Providers**
4. Make sure **Email** is enabled
5. Enable **"Confirm email"** option
6. Save changes

### Via Management API (Alternative):
```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="hjauuaxltcuojxgepfso"

# Enable email confirmation
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_autoconfirm": false,
    "enable_confirmations": true
  }'
```

## Step 2: Configure Email Templates

### Via Supabase Dashboard:
1. Go to **Authentication** → **Email Templates**
2. Select **"Confirm signup"** template
3. Replace the content with the HTML template from `email-templates/confirmation.html`
4. Update the subject line to: **"Welcome to EngageAI - Confirm Your Email"**
5. Save changes

### Via Management API (Alternative):
```bash
# Update the confirmation email template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Welcome to EngageAI - Confirm Your Email",
    "mailer_templates_confirmation_content": "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Welcome to EngageAI - Confirm Your Email</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;line-height:1.6;color:#333;background-color:#f8fafc}.container{max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06)}.header{background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);padding:40px 30px;text-align:center;color:white}.logo{font-size:32px;font-weight:700;margin-bottom:8px;letter-spacing:-0.5px}.tagline{font-size:16px;opacity:0.9;font-weight:400}.content{padding:40px 30px}.welcome-text{font-size:24px;font-weight:600;color:#1f2937;margin-bottom:16px;text-align:center}.description{font-size:16px;color:#6b7280;margin-bottom:32px;text-align:center;line-height:1.7}.cta-button{display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:8px;font-weight:600;font-size:16px;text-align:center;margin:24px 0;transition:all 0.3s ease;box-shadow:0 4px 6px -1px rgba(139,92,246,0.3)}.cta-button:hover{transform:translateY(-2px);box-shadow:0 8px 15px -3px rgba(139,92,246,0.4)}.features{margin:40px 0;padding:24px;background-color:#f8fafc;border-radius:8px;border-left:4px solid #8b5cf6}.feature-title{font-size:18px;font-weight:600;color:#1f2937;margin-bottom:16px}.feature-list{list-style:none}.feature-list li{padding:8px 0;color:#6b7280;position:relative;padding-left:24px}.feature-list li:before{content:\"✓\";position:absolute;left:0;color:#8b5cf6;font-weight:bold}.footer{background-color:#f8fafc;padding:24px 30px;text-align:center;border-top:1px solid #e5e7eb}.footer-text{font-size:14px;color:#9ca3af;margin-bottom:16px}.social-links{margin-top:16px}.social-links a{display:inline-block;margin:0 8px;color:#8b5cf6;text-decoration:none;font-size:14px}.security-note{background-color:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:16px;margin:24px 0;font-size:14px;color:#92400e}.security-note strong{color:#78350f}@media (max-width:600px){.container{margin:10px;border-radius:8px}.header,.content,.footer{padding:24px 20px}.welcome-text{font-size:20px}.logo{font-size:28px}}</style></head><body><div class=\"container\"><div class=\"header\"><div class=\"logo\">EngageAI</div><div class=\"tagline\">Empowering Learning Through Engagement</div></div><div class=\"content\"><h1 class=\"welcome-text\">Welcome to EngageAI! 🎉</h1><p class=\"description\">Thank you for joining our community of learners and educators. We are excited to have you on board and cannot wait to see how you will engage with our platform.</p><div style=\"text-align:center;\"><a href=\"{{ .ConfirmationURL }}\" class=\"cta-button\">Confirm Your Email Address</a></div><div class=\"features\"><h3 class=\"feature-title\">What you can do with EngageAI:</h3><ul class=\"feature-list\"><li>Track your learning engagement and progress</li><li>Earn badges and recognition for your achievements</li><li>Connect with other learners in your organization</li><li>Access personalized learning analytics</li><li>Customize your learning preferences and notifications</li></ul></div><div class=\"security-note\"><strong>Security Note:</strong> This link will expire in 24 hours for your security. If you did not create an account with EngageAI, you can safely ignore this email.</div></div><div class=\"footer\"><p class=\"footer-text\">This email was sent to {{ .Email }}. If you have any questions, please do not hesitate to reach out to our support team.</p><div class=\"social-links\"><a href=\"{{ .SiteURL }}\">Visit Website</a> | <a href=\"{{ .SiteURL }}/support\">Support</a> | <a href=\"{{ .SiteURL }}/privacy\">Privacy Policy</a></div></div></div></body></html>"
  }'
```

## Step 3: Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your application URL (e.g., `http://localhost:5173` for development)
3. Add your redirect URLs to the **Redirect URLs** list:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/`

## Step 4: Test Email Confirmation

### Option 1: Using the Default SMTP (Development)
- The default SMTP service will only send emails to team members
- Add your email to the team in **Organization Settings** → **Team**
- Test signup with your email address

### Option 2: Set up Custom SMTP (Production)
For production use, set up a custom SMTP server:

1. Choose an email service (Resend, SendGrid, AWS SES, etc.)
2. Go to **Authentication** → **SMTP Settings**
3. Configure your SMTP credentials
4. Set the **From Email** to something like `no-reply@yourdomain.com`

## Step 5: Update Frontend Code

Update your signup function in `src/App.tsx` to handle email confirmation:

```typescript
const signup = (userData: any): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            organization: userData.organization
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        reject(new Error(error.message));
        return;
      }

      if (data.user && data.session) {
        // User is confirmed immediately (if email confirmation is disabled)
        await loadUserProfile(data.user.id, data.user.email!);
        resolve(/* user object */);
      } else if (data.user && !data.session) {
        // User needs to confirm email
        alert('Please check your email to confirm your account before signing in.');
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
};
```

## Step 6: Create Auth Callback Page

Create `src/components/AuthCallback.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        navigate('/dashboard');
      } else if (error) {
        console.error('Auth callback error:', error);
        navigate('/auth?error=confirmation_failed');
      } else {
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
```

## Step 7: Add Route for Auth Callback

Update your `src/App.tsx` to include the callback route:

```typescript
// Add this import
import AuthCallback from './components/AuthCallback';

// Add this route in your Routes component
<Route path="/auth/callback" element={<AuthCallback />} />
```

## Email Template Features

The email template includes:

✅ **Beautiful Design**: Purple gradient theme matching EngageAI branding
✅ **Responsive Layout**: Works on mobile and desktop
✅ **Security Features**: Clear security notice and expiration warning
✅ **Feature Highlights**: Lists key EngageAI features
✅ **Professional Footer**: Links to website, support, and privacy policy
✅ **Accessibility**: Proper contrast ratios and readable fonts

## Troubleshooting

### Email Not Sending
1. Check if your email is added to the team (for default SMTP)
2. Verify SMTP settings if using custom SMTP
3. Check rate limits in **Authentication** → **Rate Limits**

### Template Not Updating
1. Clear browser cache
2. Wait a few minutes for changes to propagate
3. Check the Management API response for errors

### Confirmation Link Not Working
1. Verify Site URL configuration
2. Check redirect URLs list
3. Ensure the confirmation URL is properly formatted

## Next Steps

1. **Test the email flow** with a test account
2. **Set up custom SMTP** for production use
3. **Configure additional email templates** (password reset, magic link, etc.)
4. **Monitor email delivery** in your Supabase logs

Your EngageAI project now has beautiful, branded email confirmation emails! 🎉 