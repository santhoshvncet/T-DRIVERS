import {
  IonImg,
  IonLabel,
  IonRow,
  IonList,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonInput,
  IonGrid,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { LoadingButton } from "../common/LoadingButton";
import { pencil } from "ionicons/icons";
import util from "../utils";

const InfoCard = ({
  value,
  editable,
  onChange,
  placeholder,
  validate,
}: {
  value: string;
  editable: boolean;
  onChange?: (val: string) => void;
  placeholder?: string;
  validate?: (val: string) => boolean | string;
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (val: string) => {
    onChange?.(val);

    if (validate) {
      const res = validate(val);
      setError(res === true ? null : (res as string));
    }
  };

  return (
    <IonCard className="bg-white rounded-xl px-5 border border-gray-200">
      <IonCardContent>
        {editable ? (
          <>
            <IonInput
              value={value}
              onIonInput={(e) => handleChange(e.detail.value ?? "")}
              className="text-base"
              placeholder={placeholder}
            />
            {error && (
              <IonLabel color="danger" className="text-xs mt-1">
                {error}
              </IonLabel>
            )}
          </>
        ) : (
          <IonLabel>{value}</IonLabel>
        )}
      </IonCardContent>
    </IonCard>
  );
};

const ProfileInfo = ({ user, details, onSave }: any) => {
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (details) {
      setForm({
        name: details.name || user.name || "",
        phone: details.phone || "",
        email: details.email || "",
        address: details.address || "",
      });
    }
  }, [details, user?.name]);

  return (
    <IonGrid class="flex flex-col mx-auto mb-20">
      {/* PROFILE IMAGE + NAME */}
      <IonRow className="flex flex-col items-center mt-6 mb-8">
        <div className="flex justify-center items-center mt-6 mb-4">
          <IonAvatar className="w-28 h-28">
            <IonImg
              src={details.profile_url || "/default_avatar.png"}
              className="w-full h-full object-cover"
            />
          </IonAvatar>
        </div>

        {editMode ? (
          <IonInput
            value={form.name}
            onIonInput={(e) =>
              setForm((prev) => ({ ...prev, name: e.detail.value ?? "" }))
            }
            className="text-xl font-bold text-gray-900 text-center"
            placeholder="Enter your Name"
          />
        ) : (
          <IonLabel className="text-xl font-bold text-gray-900">
            {form.name}
          </IonLabel>
        )}

        {details.joined_date && (
          <IonLabel className="text-gray-400 text-sm mt-1">
            {details.joined_date}
          </IonLabel>
        )}
      </IonRow>

      {/* EDIT BUTTON (Replaced IonButton) */}
      <div className="flex justify-end mb-2">
        <LoadingButton
          label={editMode ? "Cancel" : "Edit"}
          handleButtonClick={() => {
            setEditMode((prev) => !prev)
            if(editMode){
              setForm({
                name: details.name || user.name || "",
                phone: details.phone || "",
                email: details.email || "",
                address: details.address || "",
              });
            }
          }}
          fill="outline"
          className="px-1 rounded-md text-sm-center"
          color="medium"
          size="small"
          icon={!editMode ? pencil : ''}
          iconClassName="mr-2"
        />
      </div>

      {/* INFO LIST */}
      <IonList className="space-y-4 mb-6">
        {/* Phone – read-only */}
        <InfoCard value={form.phone} editable={false} />

        {/* Email – editable in edit mode */}
        <InfoCard
          value={form.email}
          editable={editMode}
          onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
          placeholder="Enter your email"
          validate={util.validateEmail}
        />

        {/* Address – editable in edit mode */}
        <InfoCard
          value={form.address}
          editable={editMode}
          onChange={(v) => setForm((prev) => ({ ...prev, address: v }))}
          placeholder="Enter your address"
        />
      </IonList>

      {/* SAVE BUTTON (Replaced IonButton) */}
      {editMode && (
        <div className="flex justify-center px-4 mb-6 mt-6">
          <LoadingButton
            label="Save"
            expand="block"
            fill="solid"
            color="primary"
            className="w-full h-12 rounded-xl font-medium"
            handleButtonClick={() => {
              onSave(form);
              setEditMode(false);
            }}
            disable={form.name === '' || form.email === '' || form.address === ''}
          />
        </div>
      )}
    </IonGrid>
  );
};

export default ProfileInfo;