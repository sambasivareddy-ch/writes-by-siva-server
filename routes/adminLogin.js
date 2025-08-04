import { Router } from "express";
import { compare } from "bcrypt";
import { queryPG } from "../db/db.js";

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