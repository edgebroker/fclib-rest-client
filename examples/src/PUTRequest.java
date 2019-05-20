import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class PUTRequest {
    public static void main(String[] args) throws Exception {
        URL url = new URL("http://localhost:8080/api/restclient/put");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("PUT");

        String authToken = new AuthToken("restclient", "admin", "changeme").getToken();

        con.setRequestProperty("Authorization", "Bearer " + authToken);
        con.setRequestProperty("Content-Type", "application/json");

        con.setConnectTimeout(5000);
        con.setReadTimeout(5000);

        con.setDoOutput(true);

        // Writing raw json to post
        String jsonInputString = "{}";
        try(OutputStream os = con.getOutputStream()) {
            byte[] input = jsonInputString.getBytes("utf-8");
            os.write(input, 0, input.length);
        }

        int status = con.getResponseCode();

        Reader streamReader = null;

        if (status > 299) {
            streamReader = new InputStreamReader(con.getErrorStream());
        } else {
            streamReader = new InputStreamReader(con.getInputStream());
        }

        BufferedReader in = new BufferedReader(streamReader);
        String inputLine;
        StringBuffer content = new StringBuffer();
        while ((inputLine = in.readLine()) != null) {
            content.append(inputLine);
        }
        in.close();
        con.disconnect();

        System.out.println(content);
    }
}
