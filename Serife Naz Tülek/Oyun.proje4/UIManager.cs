using UnityEngine;
using TMPro;

public class UIManager : MonoBehaviour
{
    private TextMeshProUGUI objectiveText;
    private TextMeshProUGUI messageText;

    void Awake()
    {
        CreateHUD();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.U))
        {
            ShowCardCollectedMessage();
        }
    }

    void CreateHUD()
    {
        Canvas canvas = FindObjectOfType<Canvas>();

        if (canvas == null)
        {
            GameObject canvasObj = new GameObject("Canvas");
            canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<UnityEngine.UI.CanvasScaler>();
            canvasObj.AddComponent<UnityEngine.UI.GraphicRaycaster>();
        }

        GameObject objectiveObj = new GameObject("ObjectiveText_Auto");
        objectiveObj.transform.SetParent(canvas.transform, false);

        objectiveText = objectiveObj.AddComponent<TextMeshProUGUI>();
        objectiveText.text = "Amaç: Lobide çıkış kartını bul.\nF: El feneri aç/kapat\nSpace: Basamak çık";
        objectiveText.fontSize = 32;
        objectiveText.color = Color.yellow;
        objectiveText.alignment = TextAlignmentOptions.TopLeft;

        RectTransform objectiveRect = objectiveObj.GetComponent<RectTransform>();
        objectiveRect.anchorMin = new Vector2(0, 1);
        objectiveRect.anchorMax = new Vector2(0, 1);
        objectiveRect.pivot = new Vector2(0, 1);
        objectiveRect.anchoredPosition = new Vector2(30, -30);
        objectiveRect.sizeDelta = new Vector2(950, 180);

        GameObject messageObj = new GameObject("MessageText_Auto");
        messageObj.transform.SetParent(canvas.transform, false);

        messageText = messageObj.AddComponent<TextMeshProUGUI>();
        messageText.text = "";
        messageText.fontSize = 52;
        messageText.color = Color.yellow;
        messageText.alignment = TextAlignmentOptions.Center;

        RectTransform messageRect = messageObj.GetComponent<RectTransform>();
        messageRect.anchorMin = new Vector2(0.5f, 0.5f);
        messageRect.anchorMax = new Vector2(0.5f, 0.5f);
        messageRect.pivot = new Vector2(0.5f, 0.5f);
        messageRect.anchoredPosition = new Vector2(0, 180);
        messageRect.sizeDelta = new Vector2(1200, 180);

        messageObj.SetActive(false);
    }

    public void ShowCardCollectedMessage()
    {
        if (objectiveText != null)
        {
            objectiveText.text = "Amaç: Çıkışı bul.\nDemon ve zombi tekrar ortaya çıkabilir. Dikkatli ol.";
        }

        if (messageText != null)
        {
            messageText.text = "Kart alındı! Çıkışı bul.";
            messageText.gameObject.SetActive(true);
        }

        Debug.Log("Kart UI mesajı gösterildi.");
    }

    public void ShowWinMessage()
    {
        if (objectiveText != null)
        {
            objectiveText.text = "Görev tamamlandı.";
        }

        if (messageText != null)
        {
            messageText.text = "Çıkış bulundu!\nOyunu tamamladın.";
            messageText.gameObject.SetActive(true);
        }

        Debug.Log("Win UI mesajı gösterildi.");
    }
}