exports.check = function(req, res) {
    if(!req.query.token) {
        res.render('email_verify', { message: 'リクエストが正しくありません、Emailに記載されているURLを使用してください。' });
        return;
    }
    var query = new Parse.Query("EmailVerify");
    query.equalTo("token", req.query.token);
    query.find({
        success: function(result) {
            if (!result[0]) {
                res.render('email_verify', { message: 'リクエストが正しくありません、Emailに記載されているURLを使用してください。' });
                return;
            } else if (result[0].get("isVerified") == Boolean(true)){
                res.render('email_verify', { message: '既に認証が完了しているメールアドレスです、そのままBabyryをお使いください。' });
                return;
            } else {
                result[0].set("isVerified", Boolean(true));
                result[0].save();
                res.render('email_verify', { message: 'メールアドレスの認証が完了しました。引き続きBabyryをご利用ください。'});
                return;
            }
        },
        error: function() {
            res.render('email_verify', { message: 'ネットワークエラーが発生しました。' });
            return;
        }
    });
}
