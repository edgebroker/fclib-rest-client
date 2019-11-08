function handler(input) {

    var self = this;
    var urlProp = this.props["url"];
    var timeoutSeconds = this.props["request_timeout"];

    var endpoint = withDynamicVariablesIn(urlProp);

    var URL = Java.type("java.net.URL");
    var getUrl = new URL(endpoint);

    var con = getUrl.openConnection();
    con.setRequestMethod("GET");

    var authenticator = this.getInputReference("Authenticator")();
    for (var key in authenticator) {
        var value = authenticator[key];
        con.setRequestProperty(key, value);
    }

    var headers = this.props["headers"]
    var numHeaders = headers && headers.length || 0;
    var hasCustomHeaders = numHeaders > 0;
    if (hasCustomHeaders) {
        headers.forEach(function (header) {
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
    if (status > 299) {
        handleError(input, status, con);
    } else {
        handleSuccess(input, status, con);
    }
    con.disconnect();

    function handleSuccess(input, status, connection) {
        var message = stream.create().message().bytesMessage();
        message.copyProperties(input);
        message.property("http_status").set(status);
        var ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream");
        var bos = new ByteArrayOutputStream();
        var byte;
        while ((byte = connection.getInputStream().read()) !== -1)
            bos.write(byte);
        message.body(bos.toByteArray());
        self.executeOutputLink("Success", message);
    }

    function handleError(input, status, connection) {
        var message = stream.create().message().textMessage();
        message.copyProperties(input);
        message.property("http_status").set(status);
        var streamReader = new InputStreamReader(connection.getErrorStream());
        var BufferedReader = Java.type("java.io.BufferedReader");
        var inReader = new BufferedReader(streamReader);
        var inputLine;
        var StringBuffer = Java.type("java.lang.StringBuffer");
        var content = new StringBuffer();
        while ((inputLine = inReader.readLine()) != null) {
            content.append(inputLine);
        }
        inReader.close();
        message.body(content);
        self.executeOutputLink("Error", message);
    }

    function withDynamicVariablesIn(string) {
        return replaceFlowParams(replaceMessageProperties(replaceTextBody(string)));
    }

    function replaceTextBody(value) {
        if (input.type() !== "text") {
            return value;
        }

        return replaceAll(value, "{body}", input.body());
    }

    function replaceFlowParams(value) {
        return self.substitute(value);
    }

    function replaceMessageProperties(value) {
        input.properties().forEach(function (prop) {
            value = replaceAll(value, "\\{" + prop.name() + "\\}", prop.value().toString());
        });
        return value;
    }

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }
}