import pug from 'pug';
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const templatePath = path.join(process.cwd(), '/views', 'newsletter.pug');
const compileNewsletter = pug.compile(fs.readFileSync(templatePath, 'utf8'), { filename: templatePath });

const resend = new Resend(process.env.RESEND_API);

const sendNewletterToTheSubscriber = async (post, userEmail) => {
    const html = compileNewsletter({
        brandName: 'BySiva',
        previewText: 'A new post just dropped at BySiva.blog',
        homepageUrl: 'https://www.bysiva.blog/',
        logoUrl: 'https://www.bysiva.blog/logo.png',
        primaryColor: '#2563eb',
        accentColor: '#0f172a',
        posts: [
        {
            title: post.title,
            url: `https://www.bysiva.blog/blog/${post.slug}`,
            excerpt: post.description,
            author: 'Siva',
            date: post.date
        }
        ],
        unsubscribeUrl: 'https://writes-by-siva-server-production.up.railway.app/unsubscribe?email=' + userEmail,
        managePrefsUrl: 'https://writes-by-siva-server-production.up.railway.app/preferences',
        contactEmail: 'sambasivareddychinta@gmail.com',
        addressLines: ['Vijayawada', 'India, 520002'],
        social: {
            instagram: 'https://www.instagram.com/samsr.ch/',
            linkedin: 'https://www.linkedin.com/in/samba-siva-reddy-ch/',
            github: 'https://github.com/sambasivareddy-ch'
        }
    });
    
    try {
        await resend.emails.send({
            from: '"Samba Siva" <news@bysiva.blog>',
            to: userEmail,
            subject: `New Blog: ${post.title}`,
            html
        })
        return true;
    } catch(err) {
        return false;
    }
}

export default sendNewletterToTheSubscriber;