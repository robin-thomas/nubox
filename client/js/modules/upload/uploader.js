
<html>
<head>
  <title>OpenID transaction in progress</title>
</head>
<body onload="document.forms[0].submit();">
<form id="openid_message" action="https://id.atlassian.com/openid/v2/op" method="post" accept-charset="UTF-8" enctype="application/x-www-form-urlencoded"><input name="openid.ns.crowdid" type="hidden" value="https://developer.atlassian.com/display/CROWDDEV/CrowdID+OpenID+extensions#CrowdIDOpenIDextensions-login-page-parameters"/><input name="openid.return_to" type="hidden" value="https://bitbucket.org/socialauth/complete/atlassianid/?janrain_nonce=2019-03-12T00%3A34%3A21Zsg3iZo"/><input name="openid.realm" type="hidden" value="https://bitbucket.org"/><input name="openid.ns" type="hidden" value="http://specs.openid.net/auth/2.0"/><input name="openid.sreg.optional" type="hidden" value="fullname,nickname,email"/><input name="openid.claimed_id" type="hidden" value="http://specs.openid.net/auth/2.0/identifier_select"/><input name="openid.ns.sreg" type="hidden" value="http://openid.net/extensions/sreg/1.1"/><input name="openid.crowdid.application" type="hidden" value="bitbucket"/><input name="openid.assoc_handle" type="hidden" value="16874549"/><input name="openid.mode" type="hidden" value="checkid_setup"/><input name="openid.identity" type="hidden" value="http://specs.openid.net/auth/2.0/identifier_select"/><input type="submit" value="Continue"/></form>
<script>
var elements = document.forms[0].elements;
for (var i = 0; i < elements.length; i++) {
  elements[i].style.display = "none";
}
</script>
</body>
</html>
