const senderConstants = {
  WHATSAPP: "whatsapp",
  REPORT_USER_WHATSAPP: "تقرير للطالب",
  EMAIL: "email",
  CONTACT: "contact",
  FAMILY_WHATSAPP: "واتس ولى الامر",
  REPORT_FAMILY_WHATSAPP: "تقرير لولى الامر",
};

const notificationMethods = [
  { value: senderConstants.CONTACT, label: "اشعار للطالب فى المنصه" },
  { value: senderConstants.WHATSAPP, label: "رساله للطالب واتساب" },
  { value: senderConstants.REPORT_USER_WHATSAPP, label: "تقرير للطالب واتساب" },
  { value: senderConstants.EMAIL, label: "Email" },
  {
    value: senderConstants.FAMILY_WHATSAPP,
    label: "رساله لولي امر الطالب واتساب",
  },
  {
    value: senderConstants.REPORT_FAMILY_WHATSAPP,
    label: "تقرير لولي امر الطالب واتساب",
  },
];

module.exports = { senderConstants, notificationMethods };
