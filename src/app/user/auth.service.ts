import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
// import cognitouserpool from amazon cognito identity js package
import { 
  CognitoUserPool, 
  CognitoUserAttribute, 
  CognitoUser, 
  AuthenticationDetails, 
  CognitoUserSession } from 'amazon-cognito-identity-js'
import { User } from './user.model';

// user pool id and client id can both be found in the amazon cognito console inside your created user pool
const poolData = {
  // inside objects cognito requries captial letters for the key(s)
  UserPoolId : 'us-east-1_tewEF6OM0', 
  ClientId : 'ljpsbipujidvolifnkpuo54it' 
};

// create and configure a new user pool
// userpool object that will be used along with the aws sdk for all authentication funtionalities
const userPool = new CognitoUserPool(poolData);


@Injectable()
export class AuthService {
  authIsLoading = new BehaviorSubject<boolean>(false);
  authDidFail = new BehaviorSubject<boolean>(false);
  authStatusChanged = new Subject<boolean>();
  registeredUser: CognitoUser;

  constructor(private router: Router) {}

  // signUp method
  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true);
    // user object with name, email, and password
    const user: User = {
      username: username,
      email: email,
      password: password
    };
    // password and user and default attributes so we do not explicitly need to configure them
    // we do need to configure the email
    //
    const attrList: CognitoUserAttribute[] = [];
    // create new email attribute object
    // holds 2 keys --> name and value
    const emailAttribute = {
      // name --> name of attribute we selected in cognito
      Name: "email",
      // value --> what we want to pass as a value (i.e. user email)
      Value: user.email
    };
    // creates an amazon cognito object of which it will understand on the back end
    attrList.push(new CognitoUserAttribute(emailAttribute));

    // use pool object and call the signUp method
    // null --> used for additional validation data which we could use to validate the information on the server
    // callback -- > getes executed once amazon cognito is done with the http request on the back end cognito servers
    userPool.signUp(user.username, user.password, attrList, null, function(
      err,
      result
    ) {
      if (err) {
        // what does .next do ?
        // this.authDidFail.next(true);
        // this.authIsLoading.next(false);
        console.log("authentication err", err);
        // return;
      } else {
        console.log("authenticating user");
        // custom functions
        // this.authDidFail.next(false)
        // this.authIsLoading.next(false);
        // this.registeredUser = result.user;

        // console.log('user name is' + this.registeredUser.getUsername())
      }
    });
    return;
  }

  // Confirming a registered, unauthenticated user using a confirmation code received via SMS or email
  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true);

    const userData = {
      Username: username,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        console.log("confirm failed", err);
      } else {
        console.log("confirmation successful");
        // redirect to the / route --> signIn page
        this.router.navigate(["/"]);
      }
    });
  }

  // Authenticating a user and establishing a user session with the Amazon Cognito Identity service.
  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);
    // username and password to be authenticated
    const authData = {
      Username: username,
      Password: password
    };
// configure new authentication details oject and pass in user authData
    const authDetails = new AuthenticationDetails(authData);
// userData object associated with respective userPool
    const userData = {
      Username: username,
      Pool: userPool
    };
    // create new cognitoUser with the userData in order to initialize that user
    const cognitoUser = new CognitoUser(userData);

    // need to bind "this" to a constant which can be used inside the function below
    const that = this;

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(result: CognitoUserSession) {
        console.log(result);
        console.log("access token", result.getAccessToken().getJwtToken());

        // that.authStatusChange.next(true);
        console.log("auth sucessful !");
      },
      onFailure(err) {
        console.log("failed auth", err);
      }
    });

    this.authStatusChanged.next(true);
    return;
  }

  getAuthenticatedUser() {
    return userPool.getCurrentUser();
    // cognitoUser.getUserAttributes(function(err, result) {
    //     if (err) {
    //         alert(err);
    //         return;
    //     }
    //     for (i = 0; i < result.length; i++) {
    //         console.log('attribute ' + result[i].getName() + ' has value ' + result[i].getValue());
    //     }
    // });
  }

  logout() {
    this.authStatusChanged.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser();
    const obs = Observable.create(observer => {
      if (!user) {
        observer.next(false);
      } else {
        observer.next(false);
      }
      observer.complete();
    });
    return obs;
  }
  initAuth() {
    this.isAuthenticated().subscribe(auth => this.authStatusChanged.next(auth));
  }
}
