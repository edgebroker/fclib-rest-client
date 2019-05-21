function handler(message) {

    var authToken = this.getInputReference("Auth Token")();

    var endpoint = this.props["url"];

    var URL = Java.type("java.net.URL");
    var getUrl = new URL(endpoint);

    var con = getUrl.openConnection();
    con.setRequestMethod("GET");
    con.setRequestProperty("Authorization", "Bearer " + authToken);
    con.setConnectTimeout(5000);
    con.setReadTimeout(5000);

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
        throw "HTTP GET request to '" + endpoint + "' error.";
    } else {
        stream.log().info(response);

        var textMessage = stream.create()
                                .message()
                                .textMessage();

        textMessage.body(response);

        this.executeOutputLink("Out", textMessage)
    }

}