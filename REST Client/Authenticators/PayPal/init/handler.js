function handler() {
    var STRING = Java.type("java.lang.String");

    var timeoutSeconds = this.props["request_timeout"];

    this.setOutputReference("Authenticator", execRef);

    function execRef() {
        var token = tokenFromResponse(requestAuthToken());
        return {
            "Authorization": "Bearer " + token
        };
    }

    var self = this;

    function encodedCredentials() {
        var clientId = self.props["clientid"];
        var secret = self.props["secret"];

        var credentials = new STRING(clientId + ":" + secret);
        var Base64 = Java.type("java.util.Base64");
        return Base64.getEncoder().encodeToString(credentials.getBytes());
    }

    function requestAuthToken() {

        var endpoint = "https://api.sandbox.paypal.com/v1/oauth2/token";
        var body = "grant_type=client_credentials";

        var URL = Java.type("java.net.URL");
        var getUrl = new URL(endpoint);

        var con = getUrl.openConnection();
        con.setRequestMethod("POST");


        con.setRequestProperty("Authorization", "Basic " + encodedCredentials());

        con.setConnectTimeout(timeoutSeconds * 1000 / 2);
        con.setReadTimeout(timeoutSeconds * 1000 / 2);

        con.setDoOutput(true);

        var outputStream = con.getOutputStream();
        var inputBytes =  new STRING(body).getBytes("utf-8");
        outputStream.write(inputBytes, 0, inputBytes.length);

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
            throw "HTTP POST request to '" + endpoint + "' error.";
        } else {
            stream.log().info(response);
            return response;
        }

    }

        function tokenFromResponse(response) {
            var Pattern = Java.type("java.util.regex.Pattern");
            var tokenPattern = Pattern.compile("access_token\":\"(.*?(?=\"))");
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