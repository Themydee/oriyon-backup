"use client";

import { useState, FormEvent, useEffect } from "react";
import { getSenatorialZone, LGA_ZONE_MAP, normalizeStateForZone } from "@/lib/lgaZones";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { getApiBase } from "@/lib/api";
import { saveDraft, getDraft, clearDraft } from "@/lib/draftStorage";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ResumeApplicationModal from "@/components/ResumeApplicationModal";

const API_BASE = getApiBase();

// Helper to get unique states from LGA_ZONE_MAP
const getStatesFromMap = (): string[] => {
  const states = Object.keys(LGA_ZONE_MAP).map((key) => {
    const [state] = key.split("_");
    if (state === "abuja (fct)") return "Abuja (FCT)";
    return state.charAt(0).toUpperCase() + state.slice(1) + " State";
  });
  return Array.from(new Set(states)).sort();
};

// Helper to get LGAs for a given state from LGA_ZONE_MAP
const getLGAsForState = (stateName: string): string[] => {
  if (!stateName) return [];
  const normState = normalizeStateForZone(stateName);
  const suffix = `${normState}_`;
  
  const lgas = Object.keys(LGA_ZONE_MAP)
    .filter((key) => key.startsWith(suffix))
    .map((key) => {
      const lga = key.substring(suffix.length);
      return lga
        .split(" ")
        .map((word) => {
          if (word.includes("-")) {
            return word
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join("-");
          }
          if (word.startsWith("(") && word.endsWith(")")) {
            return word.toUpperCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
    });

  return Array.from(new Set(lgas)).sort();
};


const getNormalizedState = (stateStr: string) => {
  if (!stateStr) return "";
  if (stateStr.toLowerCase().includes("oyo")) return "Oyo State";
  return stateStr.replace(/,?\s*Nigeria/gi, "").trim();
};

const STEPS = [
  "Personal Information",
  "Education",
  "Experience",
  "Digital Literacy",
  "Household & Finance",
  "Motivation & Commitment",
  "References & Declaration",
];

function ApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseInt(searchParams.get("step") || "0", 10);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── SUBMISSION STATE ──
  const [applicationId, setApplicationId] = useState("");
  const [cooperativeStep, setCooperativeStep] = useState(false);
  const [cooperativeDone, setCooperativeDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── COOPERATIVE FIELDS ──
  const [coopLoading, setCoopLoading] = useState(false);
  const [coopError, setCoopError] = useState("");
  const [locationId, setLocationId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [livestockType, setLivestockType] = useState("");
  const [agreesToConstitution, setAgreesToConstitution] = useState(false);
  const [willingToContribute, setWillingToContribute] = useState(false);

  interface Cooperative {
    id: string;
    name: string;
    state: string;
    description: string;
    isActive: boolean;
    locationId?: string | null;
    regionId?: string | null;
    zone?: string | null;
    lga?: string | null;
  }

  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [selectedCoopId, setSelectedCoopId] = useState<string>("");
  const [coopStateFilter, setCoopStateFilter] = useState<string>("");

  // Structured Address fields
  const [userState, setUserState] = useState("");
  const [userLga, setUserLga] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  // ── EXTRA COOPERATIVE FIELDS ──
  const [memberId, setMemberId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [lga, setLga] = useState("");
  const [zoneCluster, setZoneCluster] = useState("");
  const [occupation, setOccupation] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [registrationFeePaid, setRegistrationFeePaid] = useState("NO");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [monthlyContributionAmount, setMonthlyContributionAmount] = useState("2000");
  const [attendanceCommitment, setAttendanceCommitment] = useState("");

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [signature, setSignature] = useState("");
  const [remarks, setRemarks] = useState("");

  // Payment flow states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [countdown, setCountdown] = useState(5);

  // ── RESUME & DRAFT STATE ──
  const [pendingMemberId, setPendingMemberId] = useState<string>("");
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);

  // Check for saved local draft on mount
  useEffect(() => {
    const draft = getDraft("oriyon_apply_draft");
    if (draft && draft.data && Object.keys(draft.data).length > 0) {
      setHasDraftPrompt(true);
    }
  }, []);

  // ── PERSONAL INFORMATION ──
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [hasID, setHasID] = useState("");
  const [idDocument, setIdDocument] = useState("");
  const [idFilename, setIdFilename] = useState("");
  const [idMimeType, setIdMimeType] = useState("");
  const [idFileError, setIdFileError] = useState("");
  const [idFileObj, setIdFileObj] = useState<File | null>(null);

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(selected.type)) {
        setIdFileError("Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setIdFileError("File size exceeds 10MB limit.");
        return;
      }
      setIdFileError("");
      setIdFilename(selected.name);
      setIdMimeType(selected.type);
      setIdFileObj(selected);

      const reader = new FileReader();
      reader.readAsDataURL(selected);
      reader.onload = () => {
        setIdDocument(reader.result as string);
      };
    }
  };
  const [businessName, setBusinessName] = useState("");
  const [isCoop, setIsCoop] = useState("");
  const [isCommunityMember, setIsCommunityMember] = useState("");
  const [joinCoop, setJoinCoop] = useState("");
  const [desiredRoleOption1, setDesiredRoleOption1] = useState("");
  const [desiredRoleOption2, setDesiredRoleOption2] = useState("");

  // Auto-save form fields & current step to local draft
  useEffect(() => {
    if (fullName || phone || email || step > 0) {
      const timer = setTimeout(() => {
        saveDraft(
          "oriyon_apply_draft",
          {
            fullName,
            age,
            gender,
            phone,
            email,
            userState,
            userLga,
            streetAddress,
            address,
            hasID,
            businessName,
            isCoop,
            isCommunityMember,
            joinCoop,
            desiredRoleOption1,
            desiredRoleOption2,
            selectedCoopId,
            livestockType,
          },
          step
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    step,
    fullName,
    age,
    gender,
    phone,
    email,
    userState,
    userLga,
    streetAddress,
    address,
    hasID,
    businessName,
    isCoop,
    isCommunityMember,
    joinCoop,
    desiredRoleOption1,
    desiredRoleOption2,
    selectedCoopId,
    livestockType,
  ]);

  const restoreDraft = () => {
    const draft = getDraft("oriyon_apply_draft");
    if (draft && draft.data) {
      const d: any = draft.data;
      if (d.fullName) setFullName(d.fullName);
      if (d.age) setAge(d.age);
      if (d.gender) setGender(d.gender);
      if (d.phone) setPhone(d.phone);
      if (d.email) setEmail(d.email);
      if (d.userState) setUserState(d.userState);
      if (d.userLga) setUserLga(d.userLga);
      if (d.streetAddress) setStreetAddress(d.streetAddress);
      if (d.address) setAddress(d.address);
      if (d.hasID) setHasID(d.hasID);
      if (d.businessName) setBusinessName(d.businessName);
      if (d.isCoop) setIsCoop(d.isCoop);
      if (d.isCommunityMember) setIsCommunityMember(d.isCommunityMember);
      if (d.joinCoop) setJoinCoop(d.joinCoop);
      if (d.desiredRoleOption1) setDesiredRoleOption1(d.desiredRoleOption1);
      if (d.desiredRoleOption2) setDesiredRoleOption2(d.desiredRoleOption2);
      if (d.selectedCoopId) setSelectedCoopId(d.selectedCoopId);
      if (d.livestockType) setLivestockType(d.livestockType);

      if (typeof draft.step === "number") {
        router.push(`/apply?step=${draft.step}`);
      }
    }
    setHasDraftPrompt(false);
  };

  // Sync structured address to single address string
  useEffect(() => {
    if (streetAddress || userLga || userState) {
      const parts = [streetAddress, userLga, userState].filter(Boolean);
      setAddress(parts.join(", "));
    } else {
      setAddress("");
    }
  }, [streetAddress, userLga, userState]);

  // ── EDUCATION ──
  const [educationLevel, setEducationLevel] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [fieldOfStudyOther, setFieldOfStudyOther] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [graduationYearOther, setGraduationYearOther] = useState("");
  const [institution, setInstitution] = useState("");

  // ── EXPERIENCE ──
  const [hasGoatExperience, setHasGoatExperience] = useState("");
  const [goatExperienceRating, setGoatExperienceRating] = useState("");
  const [ownsGoatFarm, setOwnsGoatFarm] = useState("");
  const [yearsOperated, setYearsOperated] = useState("");
  const [highestAnimals, setHighestAnimals] = useState("");

  // ── DIGITAL LITERACY ──
  const [isDigitallyLiterate, setIsDigitallyLiterate] = useState("");
  const [digitalLiteracyRating, setDigitalLiteracyRating] = useState("");
  const [internetUsage, setInternetUsage] = useState("");
  const [devices, setDevices] = useState<string[]>([]);
  const [onlineTraining, setOnlineTraining] = useState("");
  const [platformExperience, setPlatformExperience] = useState("");
  const [toolConfidence, setToolConfidence] = useState("");

  // ── HOUSEHOLD & FINANCIAL ──
  const [isBreadwinner, setIsBreadwinner] = useState("");
  const [hasDependants, setHasDependants] = useState("");
  const [dependantsDetail, setDependantsDetail] = useState("");
  const [dependantsSchoolAge, setDependantsSchoolAge] = useState("");
  const [hasDisabledInHousehold, setHasDisabledInHousehold] = useState("");
  const [disabledDetail, setDisabledDetail] = useState("");

  // ── MOTIVATION & COMMITMENT ──
  const [benefitedBefore, setBenefitedBefore] = useState("");
  const [benefitedDetail, setBenefitedDetail] = useState("");
  const [biggestChallenge, setBiggestChallenge] = useState<string[]>([]);
  const [whyJoin, setWhyJoin] = useState("");
  const [hopesToAchieve, setHopesToAchieve] = useState("");
  const [willingTraceability, setWillingTraceability] = useState("");
  const [hasAccess, setHasAccess] = useState<string[]>([]);
  const [willingChampion, setWillingChampion] = useState("");
  const [willingDonate, setWillingDonate] = useState("");
  const [committedFullTraining, setCommittedFullTraining] = useState("");

  // ── REFERENCES & DECLARATION ──
  const [reference1, setReference1] = useState("");
  const [reference2, setReference2] = useState("");
  const [understandsCredit, setUnderstandsCredit] = useState(false);
  const [agreesToDataProcessing, setAgreesToDataProcessing] = useState(false);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  const selectedCooperative = cooperatives.find(c => c.id === selectedCoopId);
  const selectedCoopName = selectedCooperative ? selectedCooperative.name : "the Cooperative";
  const selectedCoopState = selectedCooperative ? selectedCooperative.state : "Oyo State, Nigeria";

  // Auto-set LGA, IDs, and Zone when cooperative changes
  useEffect(() => {
    if (selectedCooperative) {
      setLga(selectedCooperative.lga || selectedCooperative.name);
      setLocationId(selectedCooperative.locationId || "");
      setRegionId(selectedCooperative.regionId || "");
      setZoneCluster(selectedCooperative.zone || "");
    } else {
      setLga("");
      setLocationId("");
      setRegionId("");
      setZoneCluster("");
    }
  }, [selectedCooperative]);

  // Prefill whatsapp number from phone by default
  useEffect(() => {
    if (phone && !whatsappNumber) {
      setWhatsappNumber(phone);
    }
  }, [phone]);

  useEffect(() => {
    const fetchCooperatives = async () => {
      try {
        const res = await fetch(`${API_BASE}/cooperative`);
        if (res.ok) {
          const data = await res.json();
          setCooperatives(data);
        }
      } catch (err) {
        console.error("Failed to fetch cooperatives:", err);
      }
    };
    fetchCooperatives();
  }, []);

  // Dynamically load Paystack Inline JS script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // WhatsApp group redirect countdown timer
  useEffect(() => {
    if (paymentSuccess && whatsappLink && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentSuccess && whatsappLink && countdown === 0) {
      window.location.href = whatsappLink;
    }
  }, [paymentSuccess, whatsappLink, countdown]);

  const safeCooperatives = Array.isArray(cooperatives) ? cooperatives : [];
  const availableCoopStates = Array.from(
    new Set(safeCooperatives.map((c) => getNormalizedState(c.state)))
  ).filter(Boolean) as string[];

  // ── HELPERS ──
  const toggleArrayField = (
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const next = () => {
    setError("");
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    router.push(`?step=${nextStep}`);
    window.scrollTo(0, 0);
  };

  const back = () => {
    setError("");
    const prevStep = Math.max(step - 1, 0);
    router.push(`?step=${prevStep}`);
    window.scrollTo(0, 0);
  };

  const parseName = () => {
    const cleanName = fullName.replace(/[\u00A0\s]+/g, " ").trim();
    const nameParts = cleanName.split(" ").filter(Boolean);
    const firstName = nameParts[0] || "Applicant";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "Applicant";
    return { firstName, lastName };
  };

  // ── SHARED STYLES ──
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-white text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const radioClass =
    "flex items-center gap-2 text-sm text-gray-900 cursor-pointer";
  const sectionTitle =
    "text-lg font-bold text-green-800 mb-6 pb-2 border-b border-green-100";

  // ─────────────────────────────────────────────
  // SUBMIT EEWYLA APPLICATION
  // ─────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!understandsCredit || !declarationConfirmed || !agreesToDataProcessing) {
      setError("Please confirm the credit understanding, declaration, and data processing consent.");
      return;
    }

    const { firstName, lastName } = parseName();
    if (!firstName || !lastName) {
      setError("Please go back to Step 1 and enter your full name.");
      return;
    }

    setLoading(true);

    let finalIdDocumentUrl = "";
    if (idFileObj || idDocument) {
      try {
        if (idFileObj) {
          const resType = idFileObj.type === "application/pdf" ? "raw" : "auto";
          finalIdDocumentUrl = await uploadToCloudinary(idFileObj, resType);
        } else if (idDocument.startsWith("http://") || idDocument.startsWith("https://")) {
          finalIdDocumentUrl = idDocument;
        } else if (idDocument.startsWith("data:")) {
          finalIdDocumentUrl = await uploadToCloudinary(idDocument, "auto");
        }
      } catch (cloudErr: any) {
        console.error("Cloudinary ID upload warning:", cloudErr);
      }
    }

    const hasDocFile = Boolean(finalIdDocumentUrl || idDocument);

    const payload = {
      firstName,
      lastName,
      age,
      gender,
      phone,
      email,
      address,
      hasID: hasID || (hasDocFile ? "Yes" : "No"),
      ...(hasDocFile ? {
        idType: idType || (hasID && hasID !== "No" ? hasID : undefined),
        idFilename: idFilename || `${firstName}_${lastName}_ID`,
        idMimeType: idMimeType || "image/jpeg",
        idDocumentUrl: finalIdDocumentUrl || undefined,
      } : {}),
      businessName,
      isCoop,
      isCommunityMember,
      joinCoop,
      desiredRoleOption1,
      desiredRoleOption2,
      educationLevel,
      fieldOfStudy,
      graduationYear,
      institution,
      hasGoatExperience,
      goatExperienceRating,
      ownsGoatFarm,
      yearsOperated,
      highestAnimals,
      isDigitallyLiterate,
      digitalLiteracyRating,
      internetUsage,
      devices,
      onlineTraining,
      platformExperience,
      toolConfidence,
      isBreadwinner,
      hasDependants,
      dependantsDetail,
      dependantsSchoolAge,
      hasDisabledInHousehold,
      disabledDetail,
      benefitedBefore,
      benefitedDetail,
      biggestChallenge,
      whyJoin,
      hopesToAchieve,
      willingTraceability,
      hasAccess,
      willingChampion,
      willingDonate,
      committedFullTraining,
      reference1,
      reference2,
      understandsCredit,
      declarationConfirmed,
      agreesToDataProcessing,
    };

    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        if (typeof data.error === "string") {
          errorMessage = data.error;
        } else if (data.error && typeof data.error === "object") {
          if (data.error.fieldErrors) {
            const fieldErrs = Object.entries(data.error.fieldErrors)
              .map(([field, errs]: [string, any]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
              .join("; ");
            errorMessage = fieldErrs ? `Please check your details (${fieldErrs})` : JSON.stringify(data.error);
          } else {
            errorMessage = JSON.stringify(data.error);
          }
        } else if (Array.isArray(data.message)) {
          errorMessage = data.message.join(", ");
        } else if (typeof data.message === "string") {
          errorMessage = data.message;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Store application ID and move to cooperative step
      setApplicationId(data.id);
      setCooperativeStep(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err?.message || "Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // SUBMIT COOPERATIVE MEMBERSHIP
  // ─────────────────────────────────────────────
  const handleCooperativeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCoopError("");

    if (!agreesToConstitution || !willingToContribute) {
      setCoopError("You must agree to both conditions to join the cooperative.");
      return;
    }

    if (!livestockType) {
      setCoopError("Please select a livestock type.");
      return;
    }

    setCoopLoading(true);

    const { firstName, lastName } = parseName();

    try {
      const res = await fetch(`${API_BASE}/cooperative/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          cooperativeId: selectedCoopId,
          firstName,
          lastName,
          memberId,
          fullName,
          gender,
          dateOfBirth,
          phone,
          email: email || undefined,
          address,
          lga,
          zoneCluster,
          locationId: locationId || undefined,
          regionId: regionId || undefined,
          occupation,
          livestockType,
          yearsOfExperience,
          idType,
          idNumber,
          nextOfKinName,
          nextOfKinPhone,
          registrationFeePaid,
          monthlyContributionAmount,
          attendanceCommitment,
          whatsappNumber,
          signature,
          remarks,
          agreesToConstitution,
          willingToContribute,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 409 means already a member — treat as success
        if (res.status === 409) {
          setCooperativeDone(true);
          setSubmitted(true);
          window.scrollTo(0, 0);
          return;
        }
        let errorMessage = "Something went wrong. Please try again.";
        if (typeof data.error === "string") errorMessage = data.error;
        else if (data.error && typeof data.error === "object") errorMessage = JSON.stringify(data.error);
        else if (Array.isArray(data.message)) errorMessage = data.message.join(", ");
        else if (typeof data.message === "string") errorMessage = data.message;
        
        setCoopError(errorMessage);
        return;
      }

      const memberObj = data.member;
      if (!memberObj || !memberObj.id) {
        throw new Error("Invalid member record returned from registration.");
      }

      if (alreadyMember) {
        setCooperativeDone(true);
        setSubmitted(true);
        setPaymentSuccess(false);
        window.scrollTo(0, 0);
      } else {
        setPaymentLoading(true);

        // Initialize payment on backend
        const payInitRes = await fetch(`${API_BASE}/cooperative/payment/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: memberObj.id }),
        });

        const payInitData = await payInitRes.json();

        if (!payInitRes.ok) {
          throw new Error(payInitData.error || "Failed to initialize payment.");
        }

        // Check if Paystack Inline JS script is loaded
        if (typeof window === "undefined" || !(window as any).PaystackPop) {
          throw new Error("Payment gateway could not be loaded. Please refresh the page and try again.");
        }

        const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_live_ae70c3f282f0e83f62e446d83c12ad4d7a95b40f";

        let paymentCompleted = false;

        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: email || "member@oriyoninternational.com",
          amount: payInitData.amount * 100, // convert Naira to kobo
          ref: payInitData.reference,
          callback: function (response: any) {
            paymentCompleted = true;
            (async () => {
              try {
                setPaymentLoading(true);
                setCoopError(""); // clear any previous errors
                const verifyRes = await fetch(`${API_BASE}/cooperative/payment/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reference: response.reference }),
                });
                const verifyData = await verifyRes.json();
                if (verifyRes.ok && verifyData.status === "success") {
                  setWhatsappLink(verifyData.whatsappLink);
                  setPaymentSuccess(true);
                  setCooperativeDone(true);
                  setSubmitted(true);
                  window.scrollTo(0, 0);
                } else {
                  setCoopError(verifyData.message || "Payment verification failed. Please contact support.");
                }
              } catch (err) {
                setCoopError("An error occurred during payment verification. Please contact support.");
              } finally {
                setPaymentLoading(false);
              }
            })();
          },
          onClose: function () {
            if (!paymentCompleted) {
              setPaymentLoading(false);
              setCoopError("Payment window closed. If you completed payment, please wait a moment — verification may still be processing. Otherwise, click below to try again.");
            }
          },
        });

        handler.openIframe();
      }
    } catch (err: any) {
      setCoopError(err.message || "Something went wrong. Please try again.");
      setPaymentLoading(false);
    } finally {
      setCoopLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // FINAL SUCCESS SCREEN
  // ─────────────────────────────────────────────
  if (submitted && cooperativeDone) {
    return (
      <div className="min-h-screen bg-[#f9f6f0] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-3">
            You&apos;re all set!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Your EEWYLA application has been submitted and you have been
            registered as a member of{" "}
            <strong>
              {selectedCoopName}
            </strong>
            .
          </p>

          {paymentSuccess && whatsappLink ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                <span>💬</span> WhatsApp Group Invitation
              </p>
              <p className="text-xs text-green-700 leading-relaxed">
                Your contribution fee has been successfully verified! You are being redirected to your cooperative's official WhatsApp group in <strong className="text-sm font-bold text-green-900">{countdown}s</strong>.
              </p>
              <div className="pt-2">
                <a
                  href={whatsappLink}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg px-4 py-3 text-sm font-bold shadow-md transition"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 1.981 14.118.956 11.5.956c-5.44 0-9.866 4.372-9.87 9.802 0 1.698.449 3.355 1.3 4.827l-.999 3.648 3.737-.979zm12.305-6.311c-.33-.165-1.951-.951-2.251-1.06-.3-.11-.519-.165-.737.165-.219.33-.848 1.06-1.039 1.28-.19.22-.382.247-.712.082-1.393-.699-2.29-1.127-3.197-2.684-.24-.413.24-.383.687-1.272.075-.15.038-.282-.019-.397-.057-.115-.519-1.248-.711-1.71-.188-.453-.377-.39-.519-.398-.135-.008-.29-.01-.445-.01-.156 0-.411.058-.626.292-.215.234-.818.8-.818 1.948 0 1.148.835 2.257.95 2.413.116.156 1.644 2.511 3.984 3.52 1.348.582 2.261.8 3.033.684.864-.13 1.952-.797 2.227-1.528.275-.73.275-1.357.192-1.488-.082-.13-.3-.21-.63-.375z" />
                  </svg>
                  Join WhatsApp Group
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left space-y-3">
              <p className="text-sm text-green-800 font-semibold">
                What happens next?
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <p className="text-xs text-green-700">
                    <strong>Application received</strong> — our team will review
                    your application and contact you via email
                  </p>
                </div>
                {alreadyMember ? (
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">⏳</span>
                    <p className="text-xs text-green-700">
                      <strong>Manual Payment Pending Verification</strong> — A cooperative coordinator will verify your offline payment details. Your profile will be activated once approved.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✅</span>
                    <p className="text-xs text-green-700">
                      <strong>Cooperative membership registered</strong> — you
                      retain access to collective production and market linkages
                      regardless of training selection
                    </p>
                  </div>
                )}
                {email && (
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">📧</span>
                    <p className="text-xs text-green-700">
                      Check your inbox at <strong>{email}</strong> for confirmation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-gray-500 text-xs mb-6">
            Questions? Contact us at{" "}
            <a
              href="mailto:eewyla@oriyoninternational.com"
              className="text-green-600"
            >
              eewyla@oriyoninternational.com
            </a>{" "}
            or call{" "}
            <a href="tel:+2347073433615" className="text-green-600">
              +234 707 343 3615
            </a>
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-700 hover:bg-green-800 text-white rounded-lg px-6 py-3 text-sm font-semibold transition"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // COOPERATIVE STEP
  // ─────────────────────────────────────────────
  if (cooperativeStep && !cooperativeDone) {
    return (
      <div className="min-h-screen bg-[#f9f6f0] font-sans">
        {/* Header */}
        <div className="bg-green-800 text-white py-10 px-6 text-center">
          <p className="text-green-300 text-xs uppercase tracking-widest mb-2">
            Step 2 of 2 — Almost Done
          </p>
          <h1 className="text-3xl font-bold mb-2">Join a Cooperative</h1>
          <p className="text-green-200 text-sm max-w-xl mx-auto">
            Select from our network of registered cooperatives in Oyo State, Nigeria
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Why join banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Why join the cooperative?
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <span>🐐</span> Raise animals together and sell them as a group for more money.
              </p>
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <span>📱</span> Track and record your animals easily on your mobile phone.
              </p>
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <span>🤝</span> Sell your animals directly to Oriyon (no middle-men) to get paid.
              </p>
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <span>✅</span> You stay in the cooperative even if you are not chosen for training.
              </p>
            </div>
          </div>

          <form onSubmit={handleCooperativeSubmit}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
              
              {/* ── PERSONAL DETAILS ── */}
              <h2 className={sectionTitle}>Personal Details</h2>
              <div>
                <label className={labelClass}>Full Legal Name *</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Surname First Name Middle Name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Gender *</label>
                  <select
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input
                    required
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 08012345678"
                  />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number *</label>
                  <input
                    required
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className={inputClass}
                    placeholder="WhatsApp active number"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email Address (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Residential Address *</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                  rows={2}
                  placeholder="House number, street name, town/city"
                />
              </div>

              {/* ── SELECT COOPERATIVE & LGA ── */}
              <h2 className={sectionTitle}>Select Cooperative (LGA)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>State *</label>
                  <select
                    value={coopStateFilter}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setCoopStateFilter(selectedVal);
                      setSelectedCoopId("");
                    }}
                    className={inputClass}
                    required
                  >
                    <option value="" disabled>Select State</option>
                    {availableCoopStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Cooperative (LGA Cluster) *</label>
                  <select
                    value={selectedCoopId}
                    onChange={(e) => setSelectedCoopId(e.target.value)}
                    className={inputClass}
                    required
                    disabled={!coopStateFilter}
                  >
                    <option value="" disabled>Select Cooperative</option>
                    {cooperatives
                      .filter((c) => getNormalizedState(c.state) === coopStateFilter)
                      .filter((c, index, self) =>
                        self.findIndex((co) => co.name.trim().toLowerCase() === c.name.trim().toLowerCase()) === index
                      )
                      .map((coop) => (
                        <option key={coop.id} value={coop.id}>
                          {coop.name} {coop.isActive ? "(Registered)" : "(Pending)"}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Assigned LGA (Automatically Set) *</label>
                  <input
                    readOnly
                    value={lga}
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                    placeholder="LGA corresponding to cooperative"
                  />
                </div>
                <div>
                  <label className={labelClass}>Zone / Cluster *</label>
                  <input
                    readOnly
                    value={zoneCluster}
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                    placeholder="Auto-populated Zone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Location ID</label>
                  <input
                    readOnly
                    value={locationId}
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                    placeholder="Auto-populated Location ID"
                  />
                </div>
                <div>
                  <label className={labelClass}>Region ID</label>
                  <input
                    readOnly
                    value={regionId}
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`}
                    placeholder="Auto-populated Region ID"
                  />
                </div>
              </div>

              {selectedCooperative && (
                <div className="mt-1 p-4 bg-green-50/50 border border-green-100/60 rounded-xl text-xs text-gray-600 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-850">Status:</span>
                    {selectedCooperative.isActive ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Registered Cooperative
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">
                        Pending Registration
                      </span>
                    )}
                  </div>
                  {selectedCooperative.description && (
                    <div>
                      <p className="font-semibold text-green-800 mb-1">About this Cooperative Society:</p>
                      <p>{selectedCooperative.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── LIVESTOCK & EXPERIENCE ── */}
              <h2 className={sectionTitle}>Occupation & Livestock Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Occupation *</label>
                  <input
                    required
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Farmer, Trader"
                  />
                </div>
                <div>
                  <label className={labelClass}>Livestock Type *</label>
                  <select
                    required
                    value={livestockType}
                    onChange={(e) => setLivestockType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Type</option>
                    <option value="Goat">Goat</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Cattle">Cattle</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Mixed">Mixed (multiple types)</option>
                    <option value="None">None / Planning to start</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Years of Experience *</label>
                  <input
                    required
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 5"
                  />
                </div>
              </div>

              {/* ── MEANS OF IDENTIFICATION ── */}
              <h2 className={sectionTitle}>Identification Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Means of Identification *</label>
                  <select
                    required
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select ID Type</option>
                    <option value="NIN">NIN (National Identification Number)</option>
                    <option value="Voters Card">Voter's Card</option>
                    <option value="National ID">National ID Card</option>
                    <option value="Drivers License">Driver's License</option>
                    <option value="Passport">International Passport</option>
                    <option value="None">No ID Card Available</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>ID Card Number *</label>
                  <input
                    required={idType !== "None" && idType !== ""}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className={inputClass}
                    placeholder="Enter ID number"
                  />
                </div>
              </div>

              {/* ── NEXT OF KIN ── */}
              <h2 className={sectionTitle}>Next of Kin Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Next of Kin Name *</label>
                  <input
                    required
                    value={nextOfKinName}
                    onChange={(e) => setNextOfKinName(e.target.value)}
                    className={inputClass}
                    placeholder="Full name of next of kin"
                  />
                </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50/40 border border-green-100/60 col-span-2">
                <input
                  type="checkbox"
                  id="alreadyMember"
                  checked={alreadyMember}
                  onChange={(e) => setAlreadyMember(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="alreadyMember" className="text-xs text-gray-700 leading-relaxed cursor-pointer select-none">
                  <strong className="text-green-850 block font-bold mb-0.5">I am already a cooperative member (paid manually)</strong>
                  Tick this only if you have already registered and paid your registration fee manually to a cooperative coordinator.
                </label>
              </div>
                <div>
                  <label className={labelClass}>Next of Kin Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={nextOfKinPhone}
                    onChange={(e) => setNextOfKinPhone(e.target.value)}
                    className={inputClass}
                    placeholder="Phone number of next of kin"
                  />
                </div>
              </div>

              {/* ── FEES, COMMITMENTS & SIGNATURE ── */}
              <h2 className={sectionTitle}>Fees, Commitments & Remarks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Registration Fee Paid *</label>
                  <input
                    required
                    readOnly
                    disabled
                    value={registrationFeePaid}
                    className={`${inputClass} !bg-gray-100 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Monthly Contribution Amount *</label>
                  <input
                    required
                    readOnly
                    disabled
                    value={monthlyContributionAmount}
                    className={`${inputClass} !bg-gray-100 cursor-not-allowed`}
                    placeholder="e.g. ₦500.00, ₦1,000.00"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Attendance Commitment (Y/N) *</label>
                <select
                  required
                  value={attendanceCommitment}
                  onChange={(e) => setAttendanceCommitment(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select Option</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Digital Signature *</label>
                <input
                  required
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className={inputClass}
                  placeholder="Type your Full Legal Name to confirm signature"
                />
              </div>

              <div>
                <label className={labelClass}>Remarks / Notes</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className={inputClass}
                  rows={3}
                  placeholder="Enter any additional remarks or comments"
                />
              </div>

              {/* ── CONSTITUTION & CONTRIBUTION AGREEMENTS ── */}
              <h2 className={sectionTitle}>Agreements</h2>

              {/* Constitution — Section 3 */}
              <div className="bg-green-50/60 border border-green-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-3">
                  Constitution Agreement — Section 3
                </p>
                <p className="text-xs text-green-700 leading-relaxed mb-4">
                  Membership of {selectedCoopName} shall be open to eligible livestock producers who
                  agree to abide by this Constitution, participate financially,
                  and attend meetings regularly.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreesToConstitution}
                    onChange={(e) => setAgreesToConstitution(e.target.checked)}
                    className="mt-1 accent-green-700 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-sm text-green-900">
                    <strong>I agree</strong> to abide by the Constitution of {selectedCoopName},
                    registered under the Cooperative Laws of {selectedCoopState}
                  </span>
                </label>
              </div>

              {/* Financial contribution — Section 5 */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
                  Financial Participation — Section 5
                </p>
                <p className="text-xs text-amber-700 leading-relaxed mb-4">
                  Members of {selectedCoopName} shall pay registration fees and regular contributions
                  as agreed by the Cooperative. All funds shall be properly
                  recorded and used solely for Cooperative objectives.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={willingToContribute}
                    onChange={(e) => setWillingToContribute(e.target.checked)}
                    className="mt-1 accent-amber-700 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-sm text-amber-900">
                    <strong>I understand</strong> and agree to pay the required
                    registration fees and regular contributions as determined by
                    the Cooperative (Section 5)
                  </span>
                </label>
              </div>

              {coopError && (
                <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {coopError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="submit"
                disabled={
                  coopLoading || paymentLoading || !agreesToConstitution || !willingToContribute || !livestockType
                }
                className="flex-1 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
              >
                {coopLoading
                  ? "Registering..."
                  : paymentLoading
                  ? "Processing Payment..."
                  : "Join the Cooperative →"}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Skip cooperative — go straight to final success
                  setCooperativeDone(true);
                  setSubmitted(true);
                  window.scrollTo(0, 0);
                }}
                className="sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition"
              >
                Skip for now
              </button>
            </div>

            <p className="text-center text-gray-400 text-xs mt-4">
              You can join the cooperative at any time by contacting{" "}
              <a
                href="mailto:eewyla@oriyoninternational.com"
                className="text-green-600"
              >
                eewyla@oriyoninternational.com
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MAIN APPLICATION FORM
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f9f6f0] font-sans">

      {/* Header */}
      <div className="bg-green-800 text-white py-10 px-6 text-center">
        <p className="text-green-300 text-xs uppercase tracking-widest mb-2">
          Oriyon International
        </p>
        <h1 className="text-3xl font-bold mb-2">EEWYLA Programme Application</h1>
        <p className="text-green-200 text-sm max-w-xl mx-auto">
          Economic Empowerment of Women and Youth in Livestock Agriculture —
          13-week structured training programme
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-medium text-green-700">
              {STEPS[step]}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="hidden md:flex justify-between mt-3">
            {STEPS.map((s, i) => (
              <span
                key={i}
                className={`text-xs ${
                  i === step
                    ? "text-green-700 font-semibold"
                    : i < step
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {s.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Draft Recovery Banner */}
        {hasDraftPrompt && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-sm font-bold text-green-900">Unsaved Application Draft Found</p>
                <p className="text-xs text-green-700">We found saved answers from your earlier session.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold shadow"
              >
                Restore Saved Progress
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft("oriyon_apply_draft");
                  setHasDraftPrompt(false);
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Resume Header Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Already Started or Completing Payment?</p>
            <p className="text-xs text-blue-700">Resume your application or complete registration payment with your Phone or Email.</p>
          </div>
          <button
            type="button"
            onClick={() => setResumeModalOpen(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow"
          >
            Resume Here →
          </button>
        </div>

        <form
          onSubmit={
            step === STEPS.length - 1
              ? handleSubmit
              : (e) => {
                  e.preventDefault();
                  if (step === 0) {
                    if (!desiredRoleOption1 || !desiredRoleOption2) {
                      setError("Please select both Desired Trainee Role options.");
                      return;
                    }
                    if (desiredRoleOption1 === desiredRoleOption2) {
                      setError("Option 1 and Option 2 must be different trainee roles.");
                      return;
                    }
                  }
                  next();
                }
          }
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {/* ── STEP 0: PERSONAL INFORMATION ── */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>Personal Information</h2>

                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age *</label>
                    <input
                      required
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className={inputClass}
                      placeholder="Your age"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Gender *</label>
                    <div className="space-y-2 mt-2">
                      {["Female", "Male"].map((g) => (
                        <label key={g} className={radioClass}>
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={gender === g}
                            onChange={() => setGender(g)}
                            required
                          />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Contact Number *</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="Primary mobile number"
                  />
                </div>

                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>State *</label>
                    <select
                      required
                      value={userState}
                      onChange={(e) => {
                        setUserState(e.target.value);
                        setUserLga("");
                      }}
                      className={inputClass}
                    >
                      <option value="">Select State</option>
                      {getStatesFromMap().map((stateName) => (
                        <option key={stateName} value={stateName}>
                          {stateName}
                        </option>
                      ))}
                      <option value="Other">Other State</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>LGA (Local Government Area) *</label>
                    {userState && userState !== "Other" ? (
                      <select
                        required
                        value={userLga}
                        onChange={(e) => setUserLga(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select LGA</option>
                        {getLGAsForState(userState).map((lgaName) => (
                          <option key={lgaName} value={lgaName}>
                            {lgaName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        value={userLga}
                        onChange={(e) => setUserLga(e.target.value)}
                        className={inputClass}
                        placeholder="Enter your LGA"
                        disabled={!userState}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Street Address *</label>
                  <textarea
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className={inputClass}
                    rows={2}
                    placeholder="House number, street name, town/city"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Do you have a valid means of identification?
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Successful applicants must provide valid ID. Post-completion
                    you must also provide your BVN for resource disbursement.
                  </p>
                  <div className="space-y-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="hasID"
                          value={o}
                          checked={hasID === o}
                          onChange={() => setHasID(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>

                    <div className="mt-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 shadow-2xs">
                      <div>
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          Select Means of Identification Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={idType}
                          onChange={(e) => {
                            setIdType(e.target.value);
                            setHasID("Yes");
                          }}
                          className="w-full text-xs font-semibold text-slate-800 bg-white border border-emerald-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="National ID (NIN)">National ID (NIN Slip / Card)</option>
                          <option value="Voters Card">Voter's Card (PVC)</option>
                          <option value="Drivers Licence">Driver's License</option>
                          <option value="International Passport">International Passport</option>
                          <option value="Other Government ID">Other Valid Government ID</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-emerald-950 mb-1">
                          Upload Government ID Document File <span className="text-rose-500">*</span>
                        </label>
                        <p className="text-[11px] text-emerald-700 font-medium mb-2">
                          Attach clear photo or PDF copy of your selected ID (NIN, Voter's Card, Passport, Driver's License — up to 10MB).
                        </p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => {
                            setHasID("Yes");
                            handleIdFileChange(e);
                          }}
                          className="w-full text-xs text-slate-700 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                        />
                        {idFilename && (
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mt-2">
                            ✓ Document attached: <span className="underline">{idFilename}</span>
                          </p>
                        )}
                        {idFileError && (
                          <p className="text-xs font-bold text-rose-600 mt-2">
                            ⚠️ {idFileError}
                          </p>
                        )}
                      </div>
                    </div>
                </div>

                <div>
                  <label className={labelClass}>Business Name</label>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={inputClass}
                    placeholder="Only if you have an existing registered business"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Are you a member of an existing Co-Operative?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="isCoop"
                          value={o}
                          checked={isCoop === o}
                          onChange={() => setIsCoop(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Are you an active member of any other community groups,
                    organisations or associations?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="isCommunityMember"
                          value={o}
                          checked={isCommunityMember === o}
                          onChange={() => setIsCommunityMember(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Would you like to join the EEWYLA Co-Operative after
                    completing the programme?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="joinCoop"
                          value={o}
                          checked={joinCoop === o}
                          onChange={() => setJoinCoop(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 mt-6">
                  <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4">
                    Desired Trainee Role Selection
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Please select two different trainee role tracks you are interested in.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Desired Role Option 1 *</label>
                      <select
                        required
                        value={desiredRoleOption1}
                        onChange={(e) => setDesiredRoleOption1(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select Option 1</option>
                        {[
                          "Livestock Producer Trainee",
                          "Early Career Professionals/Student Vetinary Trainee",
                          "Early Career Professionals/Student Extension Officer Trainee",
                          "Early Career Professionals/Student Agronomist Trainee",
                          "Livestock Specialist Carpenter Trainees"
                        ].map((role) => (
                          <option key={role} value={role} disabled={role === desiredRoleOption2}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Desired Role Option 2 *</label>
                      <select
                        required
                        value={desiredRoleOption2}
                        onChange={(e) => setDesiredRoleOption2(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select Option 2</option>
                        {[
                          "Livestock Producer Trainee",
                          "Early Career Professionals/Student Vetinary Trainee",
                          "Early Career Professionals/Student Extension Officer Trainee",
                          "Early Career Professionals/Student Agronomist Trainee",
                          "Livestock Specialist Carpenter Trainees"
                        ].map((role) => (
                          <option key={role} value={role} disabled={role === desiredRoleOption1}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: EDUCATION ── */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>Education</h2>

                <div>
                  <label className={labelClass}>
                    Highest level of education *
                  </label>
                  <div className="space-y-2 mt-2">
                    {[
                      "Primary",
                      "Secondary",
                      "Vocational/Technical School",
                      "University",
                    ].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="educationLevel"
                          value={o}
                          checked={educationLevel === o}
                          onChange={() => setEducationLevel(o)}
                          required
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Field of Study</label>
                  <div className="space-y-2 mt-2">
                    {[
                      "Animal Science",
                      "Veterinary Science",
                      "Agronomy",
                      "Other",
                    ].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="fieldOfStudy"
                          value={o}
                          checked={fieldOfStudy === o}
                          onChange={() => setFieldOfStudy(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                  {fieldOfStudy === "Other" && (
                    <input
                      className={`${inputClass} mt-2`}
                      placeholder="Please specify"
                      value={fieldOfStudyOther}
                      onChange={(e) => setFieldOfStudyOther(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Year of Graduation</label>
                  <div className="space-y-2 mt-2">
                    {["2025", "2024", "2023", "2022", "Other"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="graduationYear"
                          value={o}
                          checked={graduationYear === o}
                          onChange={() => setGraduationYear(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                  {graduationYear === "Other" && (
                    <input
                      className={`${inputClass} mt-2`}
                      placeholder="Enter year"
                      value={graduationYearOther}
                      onChange={(e) => setGraduationYearOther(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Name of Higher Institution</label>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className={inputClass}
                    placeholder="Institution name"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: EXPERIENCE ── */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>
                  Experience in Small Ruminant Husbandry
                </h2>

                <div>
                  <label className={labelClass}>
                    Do you have any experience in goat production?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="hasGoatExperience"
                          value={o}
                          checked={hasGoatExperience === o}
                          onChange={() => setHasGoatExperience(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {hasGoatExperience === "Yes" && (
                  <div>
                    <label className={labelClass}>
                      Rate your level of experience (1 = Beginner, 5 = Expert)
                    </label>
                    <div className="flex gap-4 mt-2">
                      {["1", "2", "3", "4", "5"].map((n) => (
                        <label
                          key={n}
                          className="flex flex-col items-center gap-1 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="goatExperienceRating"
                            value={n}
                            checked={goatExperienceRating === n}
                            onChange={() => setGoatExperienceRating(n)}
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Do you currently own or manage a goat or sheep farming
                    business?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="ownsGoatFarm"
                          value={o}
                          checked={ownsGoatFarm === o}
                          onChange={() => setOwnsGoatFarm(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {ownsGoatFarm === "Yes" && (
                  <div>
                    <label className={labelClass}>
                      How many years have you operated your farm?
                    </label>
                    <input
                      value={yearsOperated}
                      onChange={(e) => setYearsOperated(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 3 years"
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    What is the highest number of animals you have managed?
                  </label>
                  <div className="space-y-2 mt-2">
                    {[
                      "0-5",
                      "5-15",
                      "15-30",
                      "30-50",
                      "50-100",
                      "100-200",
                      "Other",
                    ].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="highestAnimals"
                          value={o}
                          checked={highestAnimals === o}
                          onChange={() => setHighestAnimals(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: DIGITAL LITERACY ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>Digital Literacy</h2>

                <div>
                  <label className={labelClass}>
                    Do you consider yourself digitally literate?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="isDigitallyLiterate"
                          value={o}
                          checked={isDigitallyLiterate === o}
                          onChange={() => setIsDigitallyLiterate(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {isDigitallyLiterate === "Yes" && (
                  <div>
                    <label className={labelClass}>
                      Rate your digital literacy (1 = Basic, 4 = Advanced)
                    </label>
                    <div className="flex gap-4 mt-2">
                      {["1", "2", "3", "4"].map((n) => (
                        <label
                          key={n}
                          className="flex flex-col items-center gap-1 text-sm text-gray-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="digitalLiteracyRating"
                            value={n}
                            checked={digitalLiteracyRating === n}
                            onChange={() => setDigitalLiteracyRating(n)}
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    How frequently do you access the internet, and what do you
                    use it for?
                  </label>
                  <textarea
                    value={internetUsage}
                    onChange={(e) => setInternetUsage(e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="e.g. Daily, for WhatsApp, YouTube, business research..."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    What digital devices do you use most often?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Smartphone", "Laptop", "Tablet", "Other"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="checkbox"
                          value={o}
                          checked={devices.includes(o)}
                          onChange={() =>
                            toggleArrayField(o, devices, setDevices)
                          }
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Have you participated in online training, webinars, or
                    virtual meetings?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No", "Maybe"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="onlineTraining"
                          value={o}
                          checked={onlineTraining === o}
                          onChange={() => setOnlineTraining(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Describe your experience using digital systems or online
                    platforms
                  </label>
                  <textarea
                    value={platformExperience}
                    onChange={(e) => setPlatformExperience(e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="e.g. online learning platforms, purchasing online, online trading..."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    How comfortable are you learning a new digital platform on
                    your own?
                  </label>
                  <textarea
                    value={toolConfidence}
                    onChange={(e) => setToolConfidence(e.target.value)}
                    className={inputClass}
                    rows={2}
                    placeholder="Describe your comfort level..."
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4: HOUSEHOLD & FINANCIAL ── */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>
                  Household & Financial Situation
                </h2>

                <div>
                  <label className={labelClass}>
                    Are you the primary breadwinner in your household?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="isBreadwinner"
                          value={o}
                          checked={isBreadwinner === o}
                          onChange={() => setIsBreadwinner(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Do you have any dependants in your care?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="hasDependants"
                          value={o}
                          checked={hasDependants === o}
                          onChange={() => setHasDependants(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {hasDependants === "Yes" && (
                  <>
                    <div>
                      <label className={labelClass}>
                        Specify the number of dependants and their relationship
                        to you
                      </label>
                      <textarea
                        value={dependantsDetail}
                        onChange={(e) => setDependantsDetail(e.target.value)}
                        className={inputClass}
                        rows={2}
                        placeholder="e.g. 2 children, 1 elderly parent"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        If your dependants are children, are they of school age
                        (3–18)?
                      </label>
                      <div className="space-y-2 mt-2">
                        {["Yes", "No", "Maybe"].map((o) => (
                          <label key={o} className={radioClass}>
                            <input
                              type="radio"
                              name="dependantsSchoolAge"
                              value={o}
                              checked={dependantsSchoolAge === o}
                              onChange={() => setDependantsSchoolAge(o)}
                            />
                            {o}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className={labelClass}>
                    Do you have any persons with disabilities in your
                    care/household?
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="radio"
                          name="hasDisabledInHousehold"
                          value={o}
                          checked={hasDisabledInHousehold === o}
                          onChange={() => setHasDisabledInHousehold(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {hasDisabledInHousehold === "Yes" && (
                  <div>
                    <label className={labelClass}>
                      Specify the number and their relationship to you
                    </label>
                    <textarea
                      value={disabledDetail}
                      onChange={(e) => setDisabledDetail(e.target.value)}
                      className={inputClass}
                      rows={2}
                      placeholder="e.g. 1 sibling"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: MOTIVATION & COMMITMENT ── */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>
                  Motivation, Commitment & Readiness
                </h2>

                <div>
                  <label className={labelClass}>
                    Have you benefited from a livestock empowerment programme in
                    the past? *
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          required
                          type="radio"
                          name="benefitedBefore"
                          value={o}
                          checked={benefitedBefore === o}
                          onChange={() => setBenefitedBefore(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                {benefitedBefore === "Yes" && (
                  <div>
                    <label className={labelClass}>
                      Tell us about it — what was it, was it helpful, and why?
                    </label>
                    <textarea
                      value={benefitedDetail}
                      onChange={(e) => setBenefitedDetail(e.target.value)}
                      className={inputClass}
                      rows={4}
                      placeholder="Describe the programme and your experience..."
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    What is the biggest challenge you face in establishing a
                    profitable goat farming business? *
                  </label>
                  <div className="space-y-2 mt-2">
                    {[
                      "Education/Training",
                      "Difficulty sourcing quality/healthy animals",
                      "High cost of feed",
                      "Limited veterinary or other support services",
                      "Inadequate housing structures",
                      "Poor market access",
                      "Access to startup capital",
                    ].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          type="checkbox"
                          value={o}
                          checked={biggestChallenge.includes(o)}
                          onChange={() =>
                            toggleArrayField(
                              o,
                              biggestChallenge,
                              setBiggestChallenge
                            )
                          }
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Why are you interested in joining the EEWYLA Programme? *
                  </label>
                  <textarea
                    required
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    className={inputClass}
                    rows={4}
                    placeholder="Tell us why you want to join..."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    What do you hope to achieve through the EEWYLA Training
                    Programme? *
                  </label>
                  <textarea
                    required
                    value={hopesToAchieve}
                    onChange={(e) => setHopesToAchieve(e.target.value)}
                    className={inputClass}
                    rows={4}
                    placeholder="Describe your goals..."
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Are you willing to incorporate digital traceability in your
                    farm operations? *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Digital traceability significantly increases the market
                    value of your animals.
                  </p>
                  <div className="space-y-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          required
                          type="radio"
                          name="willingTraceability"
                          value={o}
                          checked={willingTraceability === o}
                          onChange={() => setWillingTraceability(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Do you have access to the following for your goat farming
                    enterprise? *
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Land", "Infrastructure", "Water", "Feed/Fodder"].map(
                      (o) => (
                        <label key={o} className={radioClass}>
                          <input
                            type="checkbox"
                            value={o}
                            checked={hasAccess.includes(o)}
                            onChange={() =>
                              toggleArrayField(o, hasAccess, setHasAccess)
                            }
                          />
                          {o}
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Are you willing to be a project champion in your local
                    community? *
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    A project champion promotes the initiative, builds
                    awareness, and serves as a trusted community voice.
                  </p>
                  <div className="space-y-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          required
                          type="radio"
                          name="willingChampion"
                          value={o}
                          checked={willingChampion === o}
                          onChange={() => setWillingChampion(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Once fully established, are you willing to donate up to 2
                    goat kids back to the EEWYLA network? *
                  </label>
                  <div className="space-y-2 mt-2">
                    {["Yes", "No"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          required
                          type="radio"
                          name="willingDonate"
                          value={o}
                          checked={willingDonate === o}
                          onChange={() => setWillingDonate(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Are you committed to attending the full 13 weeks of
                    training? *
                  </label>
                  <div className="space-y-2 mt-2">
                    {["YES", "NO", "MAYBE"].map((o) => (
                      <label key={o} className={radioClass}>
                        <input
                          required
                          type="radio"
                          name="committedFullTraining"
                          value={o}
                          checked={committedFullTraining === o}
                          onChange={() => setCommittedFullTraining(o)}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 6: REFERENCES & DECLARATION ── */}
            {step === 6 && (
              <div className="space-y-6">
                <h2 className={sectionTitle}>References & Declaration</h2>

                <div>
                  <label className={labelClass}>
                    Reference 1 — Name and contact details
                  </label>
                  <textarea
                    value={reference1}
                    onChange={(e) => setReference1(e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="Full name, phone number, relationship to you"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Reference 2 — Name and contact details
                  </label>
                  <textarea
                    value={reference2}
                    onChange={(e) => setReference2(e.target.value)}
                    className={inputClass}
                    rows={3}
                    placeholder="Full name, phone number, relationship to you"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={understandsCredit}
                      onChange={(e) => setUnderstandsCredit(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-amber-900">
                      <strong>Credit Understanding:</strong> I confirm that I
                      understand resources disbursed to beneficiaries who
                      successfully complete the training programme are not free
                      but a form of access to credit to be repaid over time.
                    </span>
                  </label>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declarationConfirmed}
                      onChange={(e) =>
                        setDeclarationConfirmed(e.target.checked)
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-green-900">
                      <strong>Declaration:</strong> I confirm that the
                      information provided in this application is accurate,
                      complete, and true.
                    </span>
                  </label>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreesToDataProcessing}
                      onChange={(e) =>
                        setAgreesToDataProcessing(e.target.checked)
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-teal-900">
                      <strong>Data Consent:</strong> I consent to the collection, storage, and processing of my personal data (including identification and financial information) by Oriyon International Limited for the purpose of administering my application, KYC, and participation in the EEWYLA program, in accordance with the <Link href="/privacy" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Privacy Policy</Link>, <Link href="/cookies" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Cookie Policy</Link>, and <Link href="/data-rights" target="_blank" className="underline font-semibold text-[#061e1a] hover:text-[#00D1C1]">Data Subject Rights</Link>.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="submit"
                className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !understandsCredit || !declarationConfirmed || !agreesToDataProcessing}
                className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Application →"}
              </button>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Questions? Contact{" "}
            <a
              href="mailto:eewyla@oriyoninternational.com"
              className="text-green-600"
            >
              eewyla@oriyoninternational.com
            </a>{" "}
            or call{" "}
            <a href="tel:+2347073433615" className="text-green-600">
              +234 707 343 3615
            </a>
          </p>
        </form>
      </div>

      <ResumeApplicationModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onSelectResume={(resumeData) => {
          if (resumeData.memberId) {
            router.push(`/cooperative?memberId=${resumeData.memberId}&pay=true`);
          } else if (resumeData.draftData) {
            restoreDraft();
          } else if (resumeData.phone || resumeData.email) {
            router.push(`/cooperative?email=${encodeURIComponent(resumeData.email || "")}&phone=${encodeURIComponent(resumeData.phone || "")}&pay=true`);
          }
        }}
      />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  );
}