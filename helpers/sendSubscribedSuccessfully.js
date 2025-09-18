import pug from 'pug';
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const templatePath = path.join(process.cwd(), '/views', 'subscribed_success.pug');
const compileNewsletter = pug.compile(fs.readFileSync(templatePath, 'utf8'), { filename: templatePath });

const resend = new Resend(process.env.RESEND_API);

const sendSubscribedMail = async (post, userEmail) => {
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
            subject: `New Blog: ${post.title}`,
            html
        })
        return true;
    } catch(err) {
        return false;
    }
}

export default sendSubscribedMail;