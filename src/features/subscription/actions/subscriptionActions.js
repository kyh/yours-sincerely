import firebase from 'firebase/app';
import { prepareDocForCreate, prepareDocForUpdate } from 'util/firestoreUtil';

export const createSubscription = token => {
  const subscription = prepareDocForCreate({
    tempStripePaymentTokenId: token.id
  });

  return firebase
    .firestore()
    .collection('subscriptions')
    .add(prepareDocForCreate(subscription))
    .catch(error => {
      alert(`Whoops, couldn't create the subscription: ${error.message}`);
    });
};

export const updateSubscription = (subscriptionId, token) => {
  const subscription = prepareDocForUpdate({
    tempStripePaymentTokenId: token.id
  });

  return firebase
    .firestore()
    .collection('subscriptions')
    .doc(subscriptionId)
    .update(subscription)
    .catch(error => {
      alert(`Whoops, couldn't edit the subscription: ${error.message}`);
    });
};

export const deleteSubscription = subscription => {
  return firebase
    .firestore()
    .collection('subscriptions')
    .doc(subscription.id)
    .delete()
    .catch(error => {
      alert(`Whoops, couldn't delete the subscription: ${error.message}`);
    });
};
