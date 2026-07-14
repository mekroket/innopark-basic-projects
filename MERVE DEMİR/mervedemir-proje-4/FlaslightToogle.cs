using UnityEngine;

public class FlashlightToggle : MonoBehaviour
{
    private Light flashlight;
    private bool isOn = true;

    void Awake()
    {
        flashlight = GetComponent<Light>();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.F))
        {
            isOn = !isOn;
            flashlight.enabled = isOn;
        }
    }
}