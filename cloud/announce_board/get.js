exports.get = function(req, res) {

    var async = require('cloud/lib/async');

    // check of reqest parameter exist
    if(!req.query) {
        res.json({"error":"no_req_param"});
        return;
    }
    if(!req.query.userid) {
        res.json({"error":"no_userid"});
        return;
    }

    var userData = new Array();
    var childData = new Array();
    var childImageData = new Array();
    var announceInfoData = {};
    var announceInfoParamsData = {};
    var announceInfoHistoryData = new Array();

    async.waterfall([
        function(callback) {
            var user = new Parse.Query("_User");
            user.equalTo("userId", req.query.userid);
            user.find({
                success: function(result) {
                    if (result.length == 0) {
                        res.json({"error":"no_user_found"});
                        return;
                    }
                    if (!result[0].get("familyId")) {
                        res.json({"error":"cannot get familyId"});
                        return;
                    }
                    userData = result;
                    callback(null, result[0].get("familyId"));
                },
                error: function() {
                    res.json({"error":"error_in_get_user_data"});
                    return;
                }
            });
        },
        function(familyId, callback) {
            var child = new Parse.Query("Child");
            child.equalTo("familyId", familyId);
            child.find({
                success: function(result) {
                    if (result.length == 0) {
                        res.json({"error":"no_child_found"});
                        return;
                    }
                    childData = result;
                    var childNum = result.length;
                    for (i = 0; i < result.length; i++) {
                        var classname = "ChildImage" + result[i].get("childImageShardIndex");
                        var childObjectId = result[i].id;
                        var childImage = new Parse.Query(classname);
                        childImage.equalTo("imageOf", childObjectId);
                        childImage.equalTo("bestFlag", "choosed");
                        childImage.find({
                            success: function(result) {
                                childImageData.push(result);
                                childNum--;
                                if (childNum == 0) {
                                    callback();
                                }
                            },
                            error: function() {
                                res.json({"error":"error_in_get_childimage_data"});
                                return;
                            }
                        });
                    }
                },
                error: function() {
                    res.json({"error":"error_in_get_child_data"});
                    return;
                }
            });
        },
        function(callback) {
            var announceInfo = new Parse.Query("AnnounceInfo");
            announceInfo.find({
                success: function(result) {
                    for (var i = 0; i < result.length; i++) {
                        var key = result[i].get("key");
                        var title = result[i].get("title");
                        var message = result[i].get("message");
                        announceInfoData[key] = {"title":title, "message":message};
                    }
                    callback();
                },
                error: function() {
                    res.json({"error":"error_in_get_announce_info"});
                    return;
                }
            });
        },
        function(callback) {
            var announceInfoParams = new Parse.Query("AnnounceInfoParams");
            announceInfoParams.find({
                success: function(result) {
                    for (var i = 0; i < result.length; i++) {
                        var key = result[i].get("key");
                        var value = result[i].get("value");
                        announceInfoParamsData[key] = value;
                    }
                    callback();
                },
                error: function() {
                    res.json({"error":"error_in_get_announce_info_params"});
                    return;
                }
            });
        },
        function(callback) {
            var announceInfoHistory = new Parse.Query("AnnounceInfoHistory");
            announceInfoHistory.equalTo("userId", userData[0].get("userId"));
            announceInfoHistory.find({
                success: function(result) {
                    for (var i = 0; i < result.length; i++) {
                        var key = result[i].get("displayed");
                        announceInfoHistoryData[key] = "1";
                    }
                    callback();
                },
                error: function() {
                    res.json({"error":"error_in_get_announce_info_history_params"});
                    return;
                }
            });
        }
    ], function (err, result) {
        if(err) {
            res.json({"error":err});
            return;
        }

        var elapseDate = getElapseDate();
        var activeRatio = getActiveRatio(elapseDate);

        var childHasBirthday = checkChildHasBirthday();
        var userRegisterCompleted = checkUserRegisterCompleted();

        console.log("elapseDate:" + elapseDate + " interval:" + announceInfoParamsData["interval"] + " activeRatio:" + activeRatio + " activeRatio:" + announceInfoParamsData["activeRatio"]);
        if (elapseDate > announceInfoParamsData["interval"] && activeRatio > announceInfoParamsData["activeRatio"]) {
            if (!childHasBirthday && !announceInfoHistoryData["childBirthday"]) {
                returnResponse("childBirthday");
            } else if (!userRegisterCompleted && !announceInfoHistoryData["registerAccount"]) {
                returnResponse("registerAccount");
            } else {
                returnResponse("");
            }
        } else {
            returnResponse("");
        }
    });

    function returnResponse(key) {
        if (key == "") {
            res.json({"error":"no_announce_info_found"});
            return;
        } else {
            res.json({"key":key,"title":announceInfoData[key]["title"],"message":announceInfoData[key]["message"]});
            return;
        }
    }

    function getElapseDate() {
        var createdAt = userData[0]["createdAt"];
        var now = new Date();
        var diff = now.getTime() - createdAt.getTime();
        return Math.floor(diff/(24*60*60*1000));
    }

    function getActiveRatio(elapsedDate) {
        if (elapsedDate == 0) {
            return 0;
        }
        var maxLength = 0;
        for (i = 0; i < childImageData.length; i++) {
            if (maxLength < childImageData[i].length) {
                maxLength = childImageData[i].length;
            }
        }
        return maxLength/elapsedDate;
    }

    function checkChildHasBirthday() {
        for (i = 0; i < childData.length; i++) {
            if (childData[i].get("birthday")) {
                return Boolean(true);
            }
        }
        return Boolean(false);
    }

    function checkUserRegisterCompleted() {
        var username = userData[0].get("username");
        if (username.length == 8 && username.indexOf("@") == -1) {
            return Boolean(false);
        }
        return Boolean(true);
    }
}
