function authCheck(req, res, next) {
    if (!req.session.admin) {
      // Session expired or not logged in
      return res.redirect('/');
    }
    next();
}

export default authCheck