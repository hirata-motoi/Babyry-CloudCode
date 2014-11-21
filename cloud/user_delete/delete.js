exports.execute_delete = function(request, response) {
    var params = request.body,
        i,
        childImageByShardIndex,
        commentByShardIndex,
        requestCount = 0,
        queue  = [],
        errors = [],
        deletedObjects = [],
        classFunctionMap = {
            "User"        : deleteUsers,
            "Child"       : deleteChildren,
            "ChildImage"  : deleteChildImages,
            "Comment"     : deleteComments,
            "FamilyRole"  : deleteFamilyRoles,
            "TutorialMap" : deleteTutorialMaps
        };


    function deleteUsers(args) {
        var users = args[0],
            query = new Parse.Query("_User");

        Parse.Cloud.useMasterKey();
        query.containedIn("objectId", users);
        query.find({
            success: function(results) {
                findSuccess(results, users)
            },
            error: findError
        });
    }

    function deleteChildren(args) {
        var query = new Parse.Query("Child"),
            children = args[0];

        query.containedIn("objectId", children);
        query.find({
            success: function(results) {
                findSuccess(results, children)
            },
            error: findError
        });
    }

    function deleteFamilyRoles(args) {
        var query = new Parse.Query("FamilyRole"),
            familyRoles = args[0];

        query.containedIn("objectId", familyRoles);
        query.find({
            success: function(results) {
                findSuccess(results, familyRoles);
            },
            error: findError
        });
    }

    function deleteChildImages(args) {
        var className = args[0],
            childImages = args[1],
            query = new Parse.Query(className);

        query.containedIn("objectId", childImages);
        query.find({
            success: function(results) {
                findSuccess(results, childImages);
            },
            error: findError
        });
    }

    function deleteComments(args) {
        var className = args[0],
            comments = args[1],
            query = new Parse.Query(className);

        query.containedIn("objectId", comments);
        query.find({
            success: function(results) {
                findSuccess(results, comments);
            },
            error: findError
        });
    }

    function deleteTutorialMaps(args) {
        var query = new Parse.Query("TutorialMap"),
            tutorialMaps = args[0];

        query.containedIn("objectId", tutorialMaps);
        query.find({
            success: function(results) {
                findSuccess(results, tutorialMaps);
            },
            error: findError
        });
    }

    function execute() {
        var i, unit, func, args;
        for (i in queue) {
            unit = queue[i];
            func = unit["function"];
            args = unit["args"];
            func(args);
        }
    }

    function finalize() {
        if (requestCount > 0) {
            return;
        }
        if (errors.length > 0) {
            console.log(errors);
            response.status(500);
            response.json({"error": errors});
        } else {
            response.json({"result": deletedObjects});
        }
        return;
    }

    function findSuccess(results, targetObjects) {
        // findできたresultsがtargetObjectsよりも少なかった場合
        // requestCountを減らしておく
        // ニアミスでデータが消された等のケース
        if (targetObjects.length !== results.length) {
            requestCount -= (targetObjects.length - results.length);
        }

        for (var i = 0; i < results.length; i++) {
            results[i].destroy({
                success: handleSuccess,
                error: handleError
            });
        }
    }

    function findError(error) {
        console.log(error);
    }
    

    function handleSuccess(obj) {
        requestCount--;
        deletedObjects.push(obj);
        finalize();
    }

    function handleError(obj, error) {
        requestCount--;
        errors.push(error);
        finalize();
    }

    for (var className in params) {
        if (className === "ChildImage" || className === "Comment") {
            for (shardIndex in params[className]) {
                dataByShardIndex = params[className][shardIndex];
                requestCount += dataByShardIndex.objectIds.length;
                queue.push({
                    "function": classFunctionMap[className],
                    "args": [dataByShardIndex.className, dataByShardIndex.objectIds]
                });
            }
        } else {
            requestCount += params[className].length;
            queue.push({
                "function": classFunctionMap[className],
                "args": [ params[className] ]
            });
        }
    }

    execute();
}
