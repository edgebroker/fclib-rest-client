function handler(input) {

    var self = this;

    var endpoint = this.props["url"];
    var bodyProp = this.props["body"];

    var body = requestBody();

    function requestBody() {
        if(bodyProp !== null && bodyProp !== undefined && bodyProp !== "") {
           return bodyProp;
        }  else {
            return input.body();
        }
    }


    function basicAuthCredentials() {
        var basicAuthUsername = self.props["basic_auth_username"];
        var basicAuthPassword = self.props["basic_auth_password"];

        if(!basicAuthUsername) {
            throw "Missing Basic Auth Username. Either provide one or uncheck 'Use Basic Auth'."
        }
        if(!basicAuthPassword) {
            throw "Missing Basic Auth Password. Either provide one or uncheck 'Use Basic Auth'."
        }

        var credentials = basicAuthUsername + ":" + basicAuthPassword;
        var Base64 = Java.type("java.util.Base64");

        return Base64.getEncoder().encodeToString(credentials.getBytes());
    }

    var URL = Java.type("java.net.URL");
    var getUrl = new URL(endpoint);

    var con = getUrl.openConnection();
    con.setRequestMethod("POST");

    var getAuthToken = this.getInputReference("Auth Token");
    if(getAuthToken) {
        var authToken = getAuthToken();
        con.setRequestProperty("Authorization", "Bearer " + authToken);
    }

    var isJsonBody = this.props["send_json"];
    if(isJsonBody) {
        con.setRequestProperty("Content-Type", "application/json");
    }

    var useBasicAuth = this.props["use_basic_auth"];
    if(useBasicAuth) {
        con.setRequestProperty("Authorization", "Basic " + basicAuthCredentials());
    }

    con.setConnectTimeout(5000);
    con.setReadTimeout(5000);

    con.setDoOutput(true);

    var outputStream = con.getOutputStream();
    var inputBytes =  body.getBytes("utf-8");
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

        var textMessage = stream.create()
                                .message()
                                .textMessage();

        textMessage.body(response);

        this.executeOutputLink("Out", textMessage)
    }

}