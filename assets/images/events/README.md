# Drop your event photos here 📸

Put your own photos in **this folder** (`assets/images/events/`) and OurMoment
will use them instead of the generated ones. Then commit + push, and I'll wire
them in and generate anything still missing.

## How to name them

Use **.jpg** or **.png** only (not `.heic` — Metro can't bundle HEIC; on
iPhone, open the photo → Share → "Save to Files" usually gives a JPG, or use the
Photos app to export as JPEG).

Name each file by the event it fits best:

| Filename | Used for |
|---|---|
| `marriage.jpg` | Wedding cover |
| `confirmation.jpg` | Confirmation cover |
| `baptism.jpg` | Baptism cover |
| `birthday.jpg` | Birthday cover |
| `special.jpg` | Special Moments cover |
| `welcome.jpg` | The opening welcome / onboarding screen |
| `gallery-1.jpg`, `gallery-2.jpg`, … | Sample photos for the demo gallery |

You don't need all of them — add whichever you have. I'll **generate the rest**
to match, so nothing is missing.

## Then push (PowerShell, inside your repo folder)

```powershell
cd C:\Users\Matty\Desktop\ourmoment
git add assets/images/events
git commit -m "Add my event photos"
git push
```

Tell me when it's pushed and I'll take it from there.
