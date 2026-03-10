import {
  IonGrid,
  IonRow,
  IonImg,
  IonLabel,
  IonList,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonInput,
} from "@ionic/react";

import { useState, useEffect, useRef } from "react";
import ToggleGroup from "../common/drivingtypetoggleUpload";
import UploadCard from "../common/UploadCard";
import { LoadingButton } from "./LoadingButton";
import { pencil } from "ionicons/icons";
import util from "../utils";
import { Languages } from "../utils/Languages";
import LanguageCheckbox from "../modules/common/languageCheckbox";

const EditableCard = ({ value, editable, onChange, placeholder, validate,
}: {
  value?: string;
  editable: boolean;
  onChange?: (val: string) => void;
  placeholder?: string;
  validate?: (val: string) => true | string;
}) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (validate && value !== undefined) {
      const res = validate(value);
      setError(res === true ? null : (res as string));
    }
  }, [value, validate]);

  const handleInput = (val: string) => {
    onChange?.(val);

    if (validate) {
      const res = validate(val);
      setError(res === true ? null : (res as string));
    }
  };

  return (
    <IonCard className="bg-white rounded-xl px-5 py-4 border border-gray-200 shadow-sm">
      {editable ? (
        <>
          <IonInput
            value={value ?? ""}
            placeholder={placeholder}
            onIonInput={(e) => handleInput(e.detail.value ?? "")}
            className={error ? "ion-invalid ion-touched" : ""}
          />

          {error && (
            <IonLabel color="danger" className="text-xs mt-1 block">
              {error}
            </IonLabel>
          )}
        </>
      ) : (
        <span>{value ?? ""}</span>
      )}
    </IonCard>
  );
};

const AccountDetailsContent = ({ details = {}, user = {}, onSave }: any) => {
  const [editMode, setEditMode] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  // const [languages, setLanguages] = useState<Languages[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    transmission: "",
    boardType: "",
    licenseFile: null as File | null,
    licensePreview: "",
    languages: [],
  });

  useEffect(() => {
    if (!details) return;

    setForm({
      name: details.full_name || details.name || user.name || "",
      phone: details.phone || user.phone || "",
      email: details.email || "",
      address: details.address || "",
      transmission: details.transmission || details.vehicle_type || "",
      boardType: details.board_type || details.license_board || "",
      licenseFile: null,
      licensePreview: details.driving_license_url || details.licence_url || "",
      languages: details.languages|| [],
    });
  }, [details]);

  const updateField = (key: string, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleLicenseUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateField("licenseFile", file);
    updateField("licensePreview", URL.createObjectURL(file));
  };

  return (
    <IonGrid class="flex flex-col mx-auto mb-20">
      <input
        type="file"
        ref={fileRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleLicenseUpload}
      />

      <IonRow className="flex flex-col items-center mt-6 mb-8 mx-4">
        <IonAvatar className="w-28 h-28">
          <IonImg
            src={
              details.profile_photo_url ||
              details.profile_url ||
              "/default_avatar.png"
            }
            className="w-full h-full object-cover"
          />
        </IonAvatar>

        {editMode ? (
          <IonInput
            value={form.name}
            onIonInput={(e) => updateField("name", e.detail.value)}
            className="text-xl font-bold text-gray-900 text-center"
            placeholder='Enter your name'
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

      {/* EDIT / CANCEL Button (Replaced IonButton) */}
      <div className="flex justify-end">
        <LoadingButton
          label={editMode ? "Cancel" : "Edit"}
          handleButtonClick={() => {
            setEditMode((prev) => !prev)
            if(editMode){
              setForm({
                name: details.full_name || details.name || user.name || "",
                phone: details.phone || user.phone || "",
                email: details.email || "",
                address: details.address || "",
                transmission: details.transmission || details.vehicle_type || "",
                boardType: details.board_type || details.license_board || "",
                licenseFile: null,
                licensePreview: details.driving_license_url || details.licence_url || "",
                languages: details.languages|| [],
              });
            }
          }}
          fill="outline"
          className="px-1 rounded-xl text-sm"
          color="medium"
          size="small"
          icon={!editMode ? pencil : ''}
          iconClassName="mr-2"
        />
      </div>

      <IonList className="space-y-4 mb-6">
        <EditableCard value={form.phone} editable={false} placeholder='Enter your Name' />
        <EditableCard
          value={form.email}
          editable={editMode}
          onChange={(v: any) => updateField("email", v)}
          placeholder='Enter your email'
          validate={util.validateEmail}
        />
        <EditableCard
          value={form.address}
          editable={editMode}
          onChange={(v: any) => updateField("address", v)}
          placeholder='Enter your address'
        />
      </IonList>

      <ToggleGroup
        readOnly={!editMode}
        values={{
          transmission: form.transmission?.toLowerCase(),
          boardType: form.boardType?.toLowerCase(),
        }}
        onChange={(vals: any) => {
          if (!editMode) return;
          updateField("transmission", vals.transmission);
          updateField("boardType", vals.boardType);
        }}
      />

      <UploadCard
        label="Driving License"
        preview={form.licensePreview ? { preview: form.licensePreview } : null}
        onClick={() => {
          if (editMode) fileRef.current?.click();
          else if (form.licensePreview)
            window.open(form.licensePreview, "_blank");
        }}
      />

      <div
        className="flex justify-center mb-10 mx-4 ">
        <LanguageCheckbox
          value={form.languages}
          editable={editMode}
          onChange={(langs) => updateField("languages", langs)}
        />
      </div>

      {editMode && (
        <div className="flex justify-center px-4">
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
            disable={form.name === '' || form.email === ''|| form.address === '' || form.transmission === '' || form.boardType === '' || form.licensePreview === ""}
          />
        </div>
      )}
    </IonGrid>
  );
};

export default AccountDetailsContent;