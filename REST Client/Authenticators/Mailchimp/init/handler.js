function handler() {
        var STRING = Java.type("java.lang.String");

        var username = "anystring";
        var password = this.props["api_key"];

        this.setOutputReference("Authenticator", execRef);

        function basicAuthHeaderValue() {
            var credentials = new STRING(username + ":" + password);
            var Base64 = Java.type("java.util.Base64");

            return Base64.getEncoder().encodeToString(credentials.getBytes());
        }

        function execRef() {
            return {
                "Authorization": "Basic " + basicAuthHeaderValue()
            };
        }
}