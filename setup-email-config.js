#!/usr/bin/env node

/**
 * EngageAI Email Template Configuration Script
 * 
 * This script helps you configure email templates for your Supabase project.
 * 
 * Usage:
 * 1. Get your access token from https://supabase.com/dashboard/account/tokens
 * 2. Set the environment variables below
 * 3. Run: node setup-email-config.js
 */

const https = require('https');

// Configuration - Update these values
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'your-access-token-here';
const PROJECT_REF = 'hjauuaxltcuojxgepfso'; // Your project reference

// Email template content
const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to EngageAI - Confirm Your Email</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .tagline {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .welcome-text {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .description {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 32px;
            text-align: center;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 24px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px -3px rgba(139, 92, 246, 0.4);
        }
        
        .features {
            margin: 40px 0;
            padding: 24px;
            background-color: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        
        .feature-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
        }
        
        .feature-list {
            list-style: none;
        }
        
        .feature-list li {
            padding: 8px 0;
            color: #6b7280;
            position: relative;
            padding-left: 24px;
        }
        
        .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #8b5cf6;
            font-weight: bold;
        }
        
        .footer {
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer-text {
            font-size: 14px;
            color: #9ca3af;
            margin-bottom: 16px;
        }
        
        .social-links {
            margin-top: 16px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            color: #8b5cf6;
            text-decoration: none;
            font-size: 14px;
        }
        
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #92400e;
        }
        
        .security-note strong {
            color: #78350f;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header, .content, .footer {
                padding: 24px 20px;
            }
            
            .welcome-text {
                font-size: 20px;
            }
            
            .logo {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">EngageAI</div>
            <div class="tagline">Empowering Learning Through Engagement</div>
        </div>
        
        <div class="content">
            <h1 class="welcome-text">Welcome to EngageAI! 🎉</h1>
            <p class="description">
                Thank you for joining our community of learners and educators. 
                We're excited to have you on board and can't wait to see how you'll 
                engage with our platform.
            </p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="cta-button">
                    Confirm Your Email Address
                </a>
            </div>
            
            <div class="features">
                <h3 class="feature-title">What you can do with EngageAI:</h3>
                <ul class="feature-list">
                    <li>Track your learning engagement and progress</li>
                    <li>Earn badges and recognition for your achievements</li>
                    <li>Connect with other learners in your organization</li>
                    <li>Access personalized learning analytics</li>
                    <li>Customize your learning preferences and notifications</li>
                </ul>
            </div>
            
            <div class="security-note">
                <strong>Security Note:</strong> This link will expire in 24 hours for your security. 
                If you didn't create an account with EngageAI, you can safely ignore this email.
            </div>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This email was sent to {{ .Email }}. If you have any questions, 
                please don't hesitate to reach out to our support team.
            </p>
            <div class="social-links">
                <a href="{{ .SiteURL }}">Visit Website</a> |
                <a href="{{ .SiteURL }}/support">Support</a> |
                <a href="{{ .SiteURL }}/privacy">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>`;

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.supabase.com',
            port: 443,
            path: `/v1/projects/${PROJECT_REF}${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function configureEmailTemplates() {
    console.log('🚀 Configuring EngageAI email templates...\n');

    try {
        // Step 1: Enable email confirmation
        console.log('1. Enabling email confirmation...');
        const confirmationResponse = await makeRequest('PATCH', '/config/auth', {
            mailer_autoconfirm: false,
            enable_confirmations: true
        });

        if (confirmationResponse.status === 200) {
            console.log('✅ Email confirmation enabled successfully');
        } else {
            console.log('❌ Failed to enable email confirmation:', confirmationResponse.data);
        }

        // Step 2: Update email template
        console.log('\n2. Updating email template...');
        const templateResponse = await makeRequest('PATCH', '/config/auth', {
            mailer_subjects_confirmation: 'Welcome to EngageAI - Confirm Your Email',
            mailer_templates_confirmation_content: emailTemplate
        });

        if (templateResponse.status === 200) {
            console.log('✅ Email template updated successfully');
        } else {
            console.log('❌ Failed to update email template:', templateResponse.data);
        }

        console.log('\n🎉 Email configuration completed!');
        console.log('\nNext steps:');
        console.log('1. Go to your Supabase Dashboard → Authentication → Email Templates');
        console.log('2. Verify the template has been updated');
        console.log('3. Test the email flow with a new signup');
        console.log('4. Add your email to the team for testing (Organization Settings → Team)');

    } catch (error) {
        console.error('❌ Error configuring email templates:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure SUPABASE_ACCESS_TOKEN is set correctly');
        console.log('2. Verify the PROJECT_REF is correct');
        console.log('3. Check that your access token has the necessary permissions');
    }
}

// Check if access token is provided
if (!SUPABASE_ACCESS_TOKEN || SUPABASE_ACCESS_TOKEN === 'your-access-token-here') {
    console.log('❌ Please set your SUPABASE_ACCESS_TOKEN environment variable');
    console.log('You can get your access token from: https://supabase.com/dashboard/account/tokens');
    console.log('\nUsage:');
    console.log('export SUPABASE_ACCESS_TOKEN="your-access-token"');
    console.log('node setup-email-config.js');
    process.exit(1);
}

// Run the configuration
configureEmailTemplates(); 