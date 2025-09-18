import pug from 'pug';
import fs from 'node:fs';
import path from 'node:path';
import resend from '../lib/resend';

const templatePath = path.join(process.cwd(), '/views', 'unsubscribed.pug');
const compileNewsletter = pug.compile(fs.readFileSync(templatePath, 'utf8'), { filename: templatePath });

const sendUnSubscribedMail = async (userEmail) => {
    const html = compileNewsletter({
        brandName: 'BySiva',
        homepageUrl: 'https://www.bysiva.blog/',
        primaryColor: '#2563eb',
        accentColor: '#0f172a',
    });
    
    try {
        await resend.emails.send({
            from: '"Samba Siva" <news@bysiva.blog>',
            to: userEmail,
            subject: `✨ Goodbye for now — you’ve unsubscribed from BySiva.blog`,
            html
        })
        return true;
    } catch(err) {
        return false;
    }
}

export default sendUnSubscribedMail;