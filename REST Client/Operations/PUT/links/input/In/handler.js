function handler(input) {

    try {

        var self = this;

        var endpoint = this.props["url"];
        var bodyProp = this.props["body"] || "";
        var timeoutSeconds = this.props["request_timeout"];

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

        var body = requestBody();

        var URL = Java.type("java.net.URL");
        var getUrl = new URL(endpoint);

        var con = getUrl.openConnection();
        con.setRequestMethod("PUT");

        var authenticator = this.getInputReference("Authenticator")();
        for (var key in authenticator) {
            var value = authenticator[key];
            con.setRequestProperty(key, value);
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
            JSON.parse(body);
            con.setRequestProperty("Content-Type", "application/json");
        }

        con.setConnectTimeout(timeoutSeconds * 1000 / 2);
        con.setReadTimeout(timeoutSeconds * 1000 / 2);

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

        var textMessage = stream.create()
                                .message()
                                .textMessage();
        textMessage.body(response);

        if (status > 299) {
            throw response;
        } else {
            stream.log().info(response);
            this.executeOutputLink("Success", textMessage)
        }

    } catch (err) {
        var textMessage = stream.create()
                                .message()
                                .textMessage();
        stream.log().error(err);
        textMessage.body(err);
        this.executeOutputLink("Error", textMessage);
        throw err;
    }

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

}