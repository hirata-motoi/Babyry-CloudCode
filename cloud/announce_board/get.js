exports.get = function(req, res) {
    // check of reqest parameter exist
    if(!req.query) {
        res.json({"error":"no_req_param"});
    }
    if(!req.query.userid) {
        res.json({"error":"no_userid"});
    }

    var user_data = new Array();
    var child_data = new Array();
    var childimage_data = new Array();

    var child_num = 0;
    get_user_data();

    function get_user_data() {
        var user = new Parse.Query("_User");
        user.equalTo("userId", req.query.userid);
        user.find({
            success: function(result) {
                if (result.length == 0) {
                    res.json({"error":"no_user_found"});
                }
                if (!result[0].get("familyId")) {
                    res.json({"error":"cannot get familyId"});
                }
                user_data = result;
                get_child_data(result[0].get("familyId"));
            },
            error: function() {
                res.json({"error":"error_in_get_user_data"});
            }
        });
    }

    function get_child_data(familyId) {
        var child = new Parse.Query("Child");
        child.equalTo("familyId", familyId);
        child.find({
            success: function(result) {
                if (result.length == 0) {
                    res.json({"error":"no_child_found"});
                }
                child_num = result.length;
                child_data = result;
                for (i = 0; i < result.length; i++) {
                    get_childimage_data("ChildImage" + result[i].get("childImageShardIndex"), result[i].id, i);
                }
            },
            error: function() {
                res.json({"error":"error_in_get_child_data"});
            }
        });
    }

    function get_childimage_data(classname, childObjectId, i) {
        var childimage = new Parse.Query(classname);
        childimage.equalTo("imageOf", childObjectId);
        childimage.equalTo("bestFlag", "choosed");
        childimage.find({
            success: function(result) {
                childimage_data[i] = result;
                get_childimage_data_callback(result, childObjectId);
            },
            error: function() {
                res.json({"error":"error_in_get_childimage_data"});
            }
        });
    }

    function get_childimage_data_callback(result, childObjectId) {
        child_num--;
        if (child_num < 1) {
            get_announce_info();
        }
    }

    function get_announce_info() {

        var elapsedDate = get_elapse_date();
        var activity_ratio = get_activity(elapsedDate);
        
        // child birthday exist (at least one child)
        var child_has_birthday = check_child_has_birthday();

        // check user register complete
        var user_register_completed = check_user_register_completed();

        if (elapsedDate > 7 && activity_ratio > 0.8 && !child_has_birthday) {
            return_response("childBirthday");
        } else if (elapsedDate > 7 && activity_ratio > 0.8 && !user_register_completed) {
            return_response("registerAccount");
        } else {
            res.json({"title":"","message":""});
        }
    }

    function return_response(key) {
        var announceInfo = new Parse.Query("AnnounceInfo");
        announceInfo.equalTo("key", key);
        announceInfo.find({
            success: function(result) {
                res.json({"title":result[0].get("title"),"message":result[0].get("message")});
            },
            error: function() {
                res.json({"error":"error_in_get_announce_info"});
            }
        });
    }

    function get_elapse_date() {
        var createdAt = user_data[0]["createdAt"];
        var now = new Date();
        var diff = now.getTime() - createdAt.getTime();
        return Math.floor(diff/(24*60*60*1000));
    }

    function get_activity(elapsedDate) {
        if (elapsedDate == 0) {
            return 0;
        }
        var max_length = 0;
        for (i = 0; i < childimage_data.length; i++) {
            if (max_length < childimage_data[i].length) {
                max_length = childimage_data[i].length;
            }
        }
        return max_length/elapsedDate;
    }

    function check_child_has_birthday() {
        for (i = 0; i < child_data.length; i++) {
            if (child_data[i].get("birthday")) {
                return Boolean(true);
            }
        }
        return Boolean(false);
    }

    function check_user_register_completed() {
        var username = user_data[0].get("username");
        if (username.length == 8 && username.indexOf("@") == -1) {
            return Boolean(false);
        }
        return Boolean(true);
    }
}
