package routemaster;
import java.io.IOException;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.handler.DefaultHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.apache.log4j.Logger;
import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;

public class JettyServer extends Server {
    private static final Logger log = Logger.getLogger(JettyServer.class);
    ResourceHandler resourceHandler = new ResourceHandler();

    public JettyServer() {
        this(8080);
    }

    public JettyServer(int port) {
        super(port);

        resourceHandler.setDirectoriesListed(false);
        resourceHandler.setWelcomeFiles(new String[]{
            "index.html", "demo.html"
        });

        // Use the resources packaged into our jarfile
        resourceHandler.setResourceBase(
            getClass().getClassLoader().getResource("").toExternalForm());
        log.info("Configured to Serve " + resourceHandler.getBaseResource());

        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[] {
            resourceHandler, new DefaultHandler() });
        setHandler(handlers);
    }

    public static void main(String[] args) throws Exception {
        // Configure log4j
        BasicConfigurator.configure();
        Logger.getRootLogger().setLevel(Level.WARN); // for everyone else
        Logger.getLogger("routemaster").setLevel(Level.INFO); // for us

        // Bind to a port and serve pages up as requested
        JettyServer server = new JettyServer(
            args.length == 0 ? 8080 : Integer.parseInt(args[0]));
        server.start();
        server.join();
    }
}
