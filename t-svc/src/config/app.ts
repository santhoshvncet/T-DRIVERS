import env from '../config/env';
import express, { Router, Application, Request, Response, NextFunction } from 'express';

class App {
  public app: Application;
  public port: number;

  constructor(appInit: { port: any, middleWares: any, routes: any }) {
    this.app = express();
    this.port = appInit.port;

    // Disable ETag to avoid 304 responses
    this.app.disable("etag");

    // Apply global no-cache headers for all responses
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store"
      });
      next();
    });

    this.middlewares(appInit.middleWares);
    this.routes(appInit.routes);
  }

  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void }) {
    middleWares.forEach(middleWare => {
      this.app.use(middleWare);
    });
  }

  private routes(controllers: Router) {
    this.app.use('/service', controllers);
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Hi, I am listening on ${this.port}/service`);
    });
  }
}

export default App;