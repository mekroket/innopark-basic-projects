using UnityEngine;

public class OutdoorToLobbyTransition : MonoBehaviour
{
    [Header("Lobi")]
    public GameObject interiorRoot;

    [Header("Direkt Lobi Pozisyonu")]
    public Vector3 lobbyPosition = new Vector3(0f, 1.2f, 4f);
    public Vector3 lobbyRotation = new Vector3(0f, 180f, 0f);

    [Header("Tuş")]
    public KeyCode enterKey = KeyCode.E;

    private bool transitioned = false;
    private GameObject playerObj;

    void Start()
    {
        playerObj = GameObject.FindWithTag("Player");

        if (interiorRoot != null)
            interiorRoot.SetActive(true);
    }

    void Update()
    {
        if (transitioned)
            return;

        if (Input.GetKeyDown(enterKey))
        {
            if (playerObj == null)
                playerObj = GameObject.FindWithTag("Player");

            if (playerObj != null)
                MoveToLobby(playerObj);
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        if (transitioned)
            return;

        if (!other.CompareTag("Player"))
            return;

        MoveToLobby(other.gameObject);
    }

    void MoveToLobby(GameObject player)
    {
        transitioned = true;

        if (interiorRoot != null)
            interiorRoot.SetActive(true);

        CharacterController cc = player.GetComponent<CharacterController>();

        if (cc != null)
            cc.enabled = false;

        player.transform.position = lobbyPosition;
        player.transform.rotation = Quaternion.Euler(lobbyRotation);

        Camera cam = player.GetComponentInChildren<Camera>(true);

        if (cam != null)
        {
            cam.gameObject.SetActive(true);
            cam.transform.localPosition = new Vector3(0f, 0.9f, 0f);
            cam.transform.localRotation = Quaternion.identity;
        }

        if (cc != null)
            cc.enabled = true;

        Debug.Log("LOBIYE GECILDI - PLAYER ICERI ALINDI");
    }
}