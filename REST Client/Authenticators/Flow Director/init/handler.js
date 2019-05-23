function handler() {

    var serverUrl = this.props["server_url"];
    var app = this.props["app"];
    var username = this.props["username"];
    var password = this.props["password"];
    var timeoutSeconds = this.props["request_timeout"];

    this.setOutputReference("Authenticator", execRef);
    var self = this;
    function execRef() {
        var token = tokenFromResponse(attemptLogin());
        return {
            "Authorization": "Bearer " + token
        };
    }

    function attemptLogin() {

        var URL = Java.type("java.net.URL");
        var loginUrl = new URL(serverUrl + "/auth/login");

        var con = loginUrl.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json");


        con.setConnectTimeout(timeoutSeconds * 1000 / 2);
        con.setReadTimeout(timeoutSeconds * 1000 / 2);

        con.setDoOutput(true);

        jsonInputString = "{\"app\":\"" + app + "\", \"username\": \"" + username + "\", \"password\": \"" + password + "\"}";

        var os = con.getOutputStream()
        var input = jsonInputString.getBytes("utf-8");
        os.write(input, 0, input.length);

        var status = con.getResponseCode();

        var InputStreamReader = Java.type("java.io.InputStreamReader");
        var streamReader;

        if (status > 299) {
            streamReader = new InputStreamReader(con.getErrorStream());
        } else {
            streamReader = new InputStreamReader(con.getInputStream());
        }

        var BufferedReader = Java.type("java.io.BufferedReader");
        var inReader = new BufferedReader(streamReader);
        var inputLine;
        var StringBuffer = Java.type("java.lang.StringBuffer");
        var content = new StringBuffer();
        while ((inputLine = inReader.readLine()) != null) {
            content.append(inputLine);
        }
        inReader.close();
        con.disconnect();

        var response = content.toString();

        if (status > 299) {
            stream.log().error(response);
            throw "Failed authenticating user '" + username + "' on app '" + app + "'.";
        } else {
            return response;
        }
    }

    function tokenFromResponse(response) {
        var Pattern = Java.type("java.util.regex.Pattern");
        var tokenPattern = Pattern.compile("access_token\" : \"(.*?(?=\"))");
        var matcher = tokenPattern.matcher(response);

        var token = "";

        while (matcher.find()) {
            token = matcher.group(1);
        }

        if (token.isEmpty()) {
            throw  "Error parsing auth token from authenticate response.";
        } else {
            return token;
        }
    }

}