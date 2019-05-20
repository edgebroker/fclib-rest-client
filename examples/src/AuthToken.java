import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AuthToken {

    private String app;
    private String username;
    private String password;

    private String token;

    public AuthToken(String app, String username, String password) throws Exception {
        this.app = app;
        this.username = username;
        this.password = password;

        this.token = tokenFromResponse(attemptLogin());
    }

    private String attemptLogin() throws Exception {

        URL url = new URL("http://localhost:8080/auth/login");
        HttpURLConnection con = (HttpURLConnection) url.openConnection();
        con.setRequestMethod("POST");

        con.setRequestProperty("Content-Type", "application/json");

        con.setConnectTimeout(5000);
        con.setReadTimeout(5000);

        con.setDoOutput(true);

        // Writing raw json to post
        String jsonInputString = "{\"app\":\"" + this.app + "\", \"username\": \"" + this.username + "\", \"password\": \"" + this.password + "\"}";
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

        if (status > 299) {
            throw new Exception(content.toString());
        } else {
            return content.toString();
        }
    }

    private String tokenFromResponse(String response) throws Exception {
        Pattern pattern = Pattern.compile("access_token\" : \"(.*?(?=\"))");
        Matcher matcher = pattern.matcher(response);

        String token = "";

        while (matcher.find()) {
            token = matcher.group(1);
        }

        if (token.isEmpty()) {
            throw new Exception("Error parsing auth token from response");
        } else {
            return token;
        }
    }

    public static void main(String[] args) throws Exception {
        AuthToken authToken = new AuthToken("restclient", "admin", "changeme");
    }

    public String getToken() {
        return token;
    }
}
