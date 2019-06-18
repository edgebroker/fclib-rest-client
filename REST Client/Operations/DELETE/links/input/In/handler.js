function handler(input) {

    try {

        var self = this;

        var urlProp = this.props["url"];
        var timeoutSeconds = this.props["request_timeout"];

        var endpoint = withDynamicVariablesIn(urlProp);

        var URL = Java.type("java.net.URL");
        var getUrl = new URL(endpoint);

        var con = getUrl.openConnection();
        con.setRequestMethod("DELETE");

        var authenticator = this.getInputReference("Authenticator")();
        for (var key in authenticator) {
            var value = authenticator[key];
            con.setRequestProperty(key, value);
        }

        var headers = this.props["headers"]
        var numHeaders = headers && headers.length || 0;
        var hasCustomHeaders = numHeaders > 0;
        if(hasCustomHeaders) {
            headers.forEach(function(header) {
                var key = header["key"];
                var value = header["value"];
                var dynamicKey = withDynamicVariablesIn(key);
                var dynamicValue = withDynamicVariablesIn(value);
                con.setRequestProperty(dynamicKey, dynamicValue);
            });
        }

        con.setConnectTimeout(timeoutSeconds * 1000 / 2);
        con.setReadTimeout(timeoutSeconds * 1000 / 2);

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
            sendResponseToLog(response);
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

    function sendResponseToLog(response) {
        var message = "HTTP Request:" + "\n" + endpoint + "\n\n" + response;
        self.flowcontext.sendState("GREEN", message);
    }

    function withDynamicVariablesIn(string){
        return replaceFlowParams(replaceMessageProperties(string));
    }

    function replaceFlowParams(value) {
        return self.flowcontext.substitute(value);
    }

    function replaceMessageProperties(value) {
        input.properties().forEach(function(prop){
            value = replaceAll(value, "\\{"+prop.name()+"\\}", prop.value().toString());
        });
        return value;
    }

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
}