import { Router } from "express";
import { compare } from "bcrypt";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router()

router.post('/', async (req, res) => {
    const {username, password} = req.body;

    try {
        const results = await queryPG('SELECT name, password FROM admin WHERE name = $1', [username]);
        
        if (!results.rowCount) {
            res.status(401).json({
                succuess: false,
                message: 'Unauthorized admin: ' + username
            })
        }

        const row = results.rows[0]

        const isEqual = await compare(password, row['password']);
        if (isEqual) {
            req.session.admin = username;
            await notifyDiscord(process.env.DISCORD_WEBHOOK, `A admin with username ${username} have logged into Dashboard at: ${Date.now()}`)
            res.redirect('/dashboard')
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid Password'
            })
        }
    } catch(err) {
        res.status(500).json({
            err,
            succuess: false
        })
    }
})

export default router;