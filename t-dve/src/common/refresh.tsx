
import { IonRefresher, IonRefresherContent, type RefresherEventDetail } from '@ionic/react'



const Refresh = () => {
    const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
        setTimeout(() => {
            window.location.reload()
            event.detail.complete()
        }, 2000);
    }
  return (
      <IonRefresher slot="fixed" color='secondary' onIonRefresh={handleRefresh}>
          <IonRefresherContent />
      </IonRefresher>
  )
}

export default Refresh
