function handler(input) {

    var self = this;

    var endpoint = this.props["url"];
    var bodyProp = this.props["body"] || "";

    var body = requestBody();

    function requestBody() {
        var content = bodyProp
        // Substitute Message Properties
        input.properties().forEach(function(prop){
            content = replaceAll(content, "\\{"+prop.name()+"\\}", prop.value().toString());
        });
        // Substitute flow params
        content = self.flowcontext.substitute(content);
        return content;
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

    var getBasicAuthValue = this.getInputReference("Basic Auth");
    if(getBasicAuthValue) {
        con.setRequestProperty("Authorization", "Basic " + getBasicAuthValue());
    }

    var headerKeys = this.props["header_keys"];
    var headerValues = this.props["header_values"];
    var numHeaderKeys = headerKeys && headerKeys.length || 0;
    var hasCustomHeaders = numHeaderKeys > 0;
    if(hasCustomHeaders) {
        headerKeys.forEach(function(key, index) {
            var value = headerValues[index];
            if(value === undefined) {
                throw "Missing header value for key '" + key + "'."
            }
            con.setRequestProperty(key, value);
        });
    }

    var isJsonBody = this.props["send_json"];
    if(isJsonBody) {
        con.setRequestProperty("Content-Type", "application/json");
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

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

}