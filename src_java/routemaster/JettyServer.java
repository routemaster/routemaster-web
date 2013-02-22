package routemaster;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.ServletException;
import java.io.IOException;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
  import org.eclipse.jetty.server.Handler;
  import org.eclipse.jetty.server.Server;
  import org.eclipse.jetty.server.handler.DefaultHandler;
  import org.eclipse.jetty.server.handler.HandlerList;
  import org.eclipse.jetty.server.handler.ResourceHandler;
  import org.eclipse.jetty.util.log.Log;
 import org.eclipse.jetty.util.log.Logger;
 
 public class JettyServer
   {
       //private static final Logger LOG = Log.getLogger(JettyServer.class);
   
       public static void main(String[] args) throws Exception
       {
           Server server = new Server(args.length == 0?8080:Integer.parseInt(args[0]));
   
           ResourceHandler resource_handler = new ResourceHandler();
           resource_handler.setDirectoriesListed(true);
           resource_handler.setWelcomeFiles(new String[]{ "index.html" });
   
           resource_handler.setResourceBase(args.length == 2?args[1]:".");
           //LOG.info("serving " + resource_handler.getBaseResource());
           
           HandlerList handlers = new HandlerList();
           handlers.setHandlers(new Handler[] { resource_handler, new DefaultHandler() });
           server.setHandler(handlers);
   
           server.start();
           server.join();
       }
   
 }
 
//public class JettyServer extends AbstractHandler
//{
//    public void handle(String target,
//                       Request baseRequest,
//                       HttpServletRequest request,
//                       HttpServletResponse response) 
//        throws IOException, ServletException
//    {
//        response.setContentType("text/html;charset=utf-8");
//        response.setStatus(HttpServletResponse.SC_OK);
//        baseRequest.setHandled(true);
//        //response.getWriter().println("<h1>Hello World</h1>");
//        
//    }
// 
//    public static void main(String[] args) throws Exception
//    {
//        Server server = new Server(8080);
//        server.setHandler(new JettyServer());
// 
//        server.start();
//        server.join();
//    }
//}

