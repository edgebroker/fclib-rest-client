function handler(In) {
    var self = this;
    var out = stream.create().message().copyMessage(In);
    try {
        var HTTP_CLIENT = Java.type("java.net.http.HttpClient");
        var HTTP_REQUEST = Java.type("java.net.http.HttpRequest");
        var HTTP_RESPONSE = Java.type("java.net.http.HttpResponse");
        var DURATION = Java.type("java.time.Duration");
        var URI = Java.type("java.net.URI");

        var client = HTTP_CLIENT.newHttpClient();
        var builder = HTTP_REQUEST.newBuilder();
        builder.uri(new URI(withDynamicVariablesIn(this.props["url"])));
        builder.timeout(DURATION.ofSeconds(typeconvert.toLong(this.props["request_timeout"])));
        for (var i = 0; i < this.props["headers"].length; i++) {
            builder.header(this.props["headers"][i]["key"], this.props["headers"][i]["value"]);
        }
        var authenticator = this.getInputReference("Authenticator")();
        for (var key in authenticator) {
            var value = authenticator[key];
            builder.header(key, value);
        }
        var body = withDynamicVariablesIn(this.props["body"]);
        if (this.props["send_json"]) {
            JSON.parse(body);
            builder.header("Content-Type", "application/json");
        }
        builder.method("PATCH", HTTP_REQUEST.BodyPublishers.ofString(body));
        var response = client.send(builder.build(), HTTP_RESPONSE.BodyHandlers.ofString());
        out.property("http_status").set(response.statusCode());
        out.body(response.body());
        if (response.statusCode() > 299)
            this.executeOutputLink("Error", out);
        else
            this.executeOutputLink("Success", out);
    } catch (e) {
        out.property("http_status").set("900");
        out.body(e);
        this.executeOutputLink("Error", out);
    }
    
    function withDynamicVariablesIn(string) {
        return replaceFlowParams(replaceMessageProperties(replaceTextBody(string)));
    }

    function replaceTextBody(value) {
        if (In.type() !== "text") {
            return value;
        }

        return replaceAll(value, "{body}", In.body());
    }

    function replaceFlowParams(value) {
        return self.substitute(value);
    }

    function replaceMessageProperties(value) {
        In.properties().forEach(function(prop){
            value = replaceAll(value, "\\{"+prop.name()+"\\}", prop.value().toString());
        });
        return value;
    }

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

}

