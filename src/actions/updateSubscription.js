import Firebase from 'firebase/app';
import { prepareDocForUpdate } from './helpers/firestoreHelpers';

const updateSubscription = (subscriptionId, token) => {
  const subscription = prepareDocForUpdate({
    tempStripePaymentTokenId: token.id
  });

  return Firebase.firestore()
    .collection('subscriptions')
    .doc(subscriptionId)
    .update(subscription)
    .catch(error => {
      alert(`Whoops, couldn't edit the subscription: ${error.message}`);
    });
};

export default updateSubscription;
