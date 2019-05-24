function handler(message) {

    try {

        var self = this;

        var endpoint = this.props["url"];
        var timeoutSeconds = this.props["request_timeout"];

        var URL = Java.type("java.net.URL");
        var getUrl = new URL(endpoint);

        var con = getUrl.openConnection();
        con.setRequestMethod("DELETE");

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
}