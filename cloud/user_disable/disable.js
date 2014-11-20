exports.disable = function(request, response) {
    var params = request.params,
        i,
        childImageByShardIndex,
        commentByShardIndex,
        requestCount = 0,
        queue  = [],
        errors = [];

    function disableUsers(args) {
        var User = Parse.Object.extend("_User"),
            users = args[0],
            u,
            i;
        for (i in users) {
            u = new User();
            u.set("id", users[i]);
            u.set("operationDisabled", true);
            u.save(null, { useMasterKey: true }).then(handleSuccess, handleError);
        }
    }
    
    function disableChildren(args) {
        var Child = Parse.Object.extend("Child"),
            children = args[0],
            i,
            c;
        for (i in children) {
            c = new Child();
            c.set("id", children[i]);
            c.set("operationDisabled", true);
            c.setACL(inaccessibleACL());
            c.save(null, {}).then(handleSuccess, handleError);
        }
    }

    function disableFamilyRoles(args) {
        var FamilyRole = Parse.Object.extend("FamilyRole"),
            familyRoles = args[0],
            i,
            f;
        for (i in familyRoles) {
            f = new FamilyRole();
            f.set("id", familyRoles[i]);
            f.set("operationDisabled", true);
            f.setACL(inaccessibleACL());
            f.save(null, {}).then(handleSuccess, handleError);
        }
    }

    function disableChildImages(args) {
        var className = args[0],
            childImages = args[1],
            ChildImage = Parse.Object.extend(className),
            i,
            c;
        for (i in childImages) {
            c = new ChildImage();
            c.set("id", childImages[i]);
            c.set("operationDisabled", true);
            c.setACL(inaccessibleACL());
            c.save(null, {}).then(handleSuccess, handleError);
        }
    }

    function disableComments(args) {
        var className = args[0],
            comments = args[1],
            Comment = Parse.Object.extend(className),
            i,
            c;
        for (i in comments) {
            c = new Comment();
            c.set("id", comments[i]);
            c.set("operationDisabled", true);
            c.setACL(inaccessibleACL());
            c.save(null, {}).then(handleSuccess, handleError);
        }
    }

    function disableTutorialMaps(args) {
        var TutorialMap = Parse.Object.extend("TutorialMap"),
            tutorialMaps = args[0],
            i,
            t;
        for (i in tutorialMaps) {
            t = new TutorialMap();
            t.set("id", tutorialMaps[i]);
            t.set("operationDisabled", true);
            t.setACL(inaccessibleACL());
            t.save(null, {}).then(handleSuccess, handleError);
        }
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
            rsponse.error(errors);
        } else {
            response.success("normal ended");
        }
    }

    function handleSuccess() {
        requestCount--;
        finalize();
    }

    function handleError(error) {
        requestCount--;
        errors.push(error);
        finalize();
    }

    function inaccessibleACL() {
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        return acl;
    }

    if (params.User) {
        requestCount += params.User.length;
        queue.push({
            "function": disableUsers,
            "args": [params.User]
        });
    }

    if (params.Child) {
        requestCount += params.Child.length;
        queue.push({
            "function": disableChildren,
            "args": [params.Child]
        });
    }

    if (params.FamilyRole) {
        requestCount += params.FamilyRole.length;
        queue.push({
            "function": disableFamilyRoles,
            "args": [params.FamilyRole]
        });
    }

    if (params.TutorialMap) {
        requestCount += params.TutorialMap.length;
        queue.push({
            "function": disableTutorialMaps,
            "args": [params.TutorialMap]
        });
    }

    if (params.ChildImage) {
        for (i in params.ChildImage) {
            childImageByShardIndex = params.ChildImage[i];
            requestCount += childImageByShardIndex.childImages.length;
            queue.push({
                "function": disableChildImages,
                "args": [childImageByShardIndex.className, childImageByShardIndex.childImages]
            });
        }
    }

    if (params.Comment) {
        for (i in params.Comment) {
            commentByShardIndex = params.Comment[i];
            requestCount += commentByShardIndex.comments.length;
            queue.push({
                "function": disableComments,
                "args": [commentByShardIndex.className, commentByShardIndex.comments]
            });
        }
    }

    execute();
};
