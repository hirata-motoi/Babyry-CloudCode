exports.get = function(req, res) {

    var async = require('cloud/lib/async');

    // check of request parameter exist
    if(!req.query) {
        res.json({"error":"no_req_param"});
        return;
    }
    if(!req.query.childId) {
        res.json({"error":"no_childid"});
        return;
    }

    // get comments from chidIds
    var shardNum = 2;
    var oneQueryLimit = 1000;
    var childIds = req.query.childId;
    var commentsHash = new Object();
   
    getCommentRecursive("2014-01-01T00:00:00.000Z", 1);

    function getCommentRecursive(lastDate, shardIndex){
        var className = "Comment" + shardIndex;
        var comments = new Parse.Query(className);
        comments.limit(oneQueryLimit);
        comments.ascending("createdAt");
        comments.greaterThan("createdAt", lastDate);
        comments.containedIn("childId", childIds);
        comments.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var key = results[i].get("childId") + results[i].get("date");
                    if (!commentsHash[key]) {
                        commentsHash[key] = 1;
                    } else {
                        commentsHash[key]++;
                    }
                }
                if (results.length < oneQueryLimit) {
                    if (shardIndex != shardNum) {
                        getCommentRecursive("2014-01-01T00:00:00.000Z", shardIndex + 1);
                    } else {
                        res.json({"success":commentsHash});
                        return;
                    }
                } else {
                    getCommentRecursive(results[results.length -1].createdAt, shardIndex);
                }
            },
            error: function() {
                res.json({"error":"error_in_get_comment"});
                return;
            }
        });
    }
}
